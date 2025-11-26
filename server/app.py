from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from PIL import Image,ImageOps
import base64
import traceback
from pix2tex.cli import LatexOCR
from pylatexenc.latex2text import LatexNodes2Text
import pytesseract 
import cv2
import numpy as np
import io
from openai import OpenAI
import json
from dotenv import load_dotenv
import os

load_dotenv()

# If you're on Windows, you will need to point pytesseract to the path where you installed Tesseract
pytesseract.pytesseract.tesseract_cmd = r'tesseract'

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# Initialize the LaTeX OCR model
model = LatexOCR()

def image_processing(image):
    """
    Processes an image for OCR.

    Args:
        image: The PIL Image object to be processed.

    Returns:
        img: The processed image ready for OCR.
    """
    try:
        # Read the image file into a numpy array
        img = np.array(image)

        if len(img.shape) == 2:  # Grayscale image
            gray = img
        elif img.shape[2] == 4:  # RGBA image
            gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
        else:  # RGB image
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to remove noise
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        # Apply adaptive thresholding to get a binary image
        bin_img = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 2)
        
        # Perform dilation and erosion to remove noise
        kernel = np.ones((1, 1), np.uint8) 
        img = cv2.dilate(bin_img, kernel, iterations=1) 
        img = cv2.erode(img, kernel, iterations=1) 
        
        # Convert the NumPy array back to a PIL Image object
        img = Image.fromarray(img)
        return img
    except Exception as e:
        raise ValueError(f"Error in image processing: {str(e)}")



def image_processing2(image):
    """
    Minimal processing for LatexOCR.
    """
    # 1. Convert to RGB (standard for most ML models)
    if image.mode != "RGB":
        image = image.convert("RGB")
    
    # 2. (Optional) Resize if the image is massive (e.g. > 2000px width) to speed up
    # Standard phone photos are fine, but ensure it's not tiny.
    
    return image



@app.route('/')
@cross_origin()
def home():
    """
    Home route for the application.

    Returns:
        str: A string indicating that the server is running.
    """
    return 'Server is running!'

# @app.route('/latex', methods=['POST'])
# @cross_origin()
# def image_to_latex():
#     """
#     Endpoint to convert an uploaded image to LaTeX.

#     This function handles POST requests to the /latex URL. It expects a JSON payload
#     containing the image data in Base64 format. The image data should be included in 
#     the 'uri' field of the JSON object.

#     Returns:
#         flask.Response: A JSON response with either the LaTeX code or an error message.
#     """

#     try:
#         # Parse the JSON request body
#         data = request.get_json()
#         if not data or 'uri' not in data or 'type' not in data or 'name' not in data:
#             return jsonify({'error': 'Invalid input data'}), 400

#         # Decode the image data from the URI
#         image_data = base64.b64decode(data['uri'].split(',')[1])
#         image_file = Image.open(io.BytesIO(image_data))

#         # Process the image
#         img = image_processing2(image_file)

#         # Convert the image to LaTeX format using the model
#         latex_response = model(img)
        
#         # Convert LaTeX to plain text
#         text_response = LatexNodes2Text().latex_to_text(latex_response)
#         print("Text response on server:", text_response)
#     except Exception as e:
#         return jsonify({'error': str(e)}), 400
    
#     return jsonify({'latex': latex_response, 'text': text_response}), 200




@app.route('/latex', methods=['POST'])
@cross_origin()
def image_to_latex():
    try:
        data = request.get_json()
        if not data or 'uri' not in data:
            return jsonify({'error': 'Invalid input data'}), 400

        # We don't even need to process/resize the image for GPT-4o
        # It handles the base64 URI directly.
        image_uri = data['uri'] 

        prompt = """
        Extract the mathematical content from this image. 
        Return ONLY the raw LaTeX code. 
        Do not add delimiters like ```latex or $$. 
        If there is text mixed with math, wrap the text in \text{}.
        """

        response = client.chat.completions.create(
            model="gpt-4o", # Use gpt-4o or gpt-4-turbo
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_uri, # Send the data:image/jpeg;base64,... string directly
                                "detail": "high"
                            },
                        },
                    ],
                }
            ],
            max_tokens=300,
        )

        latex_response = response.choices[0].message.content
        print("OpenAI LaTeX:", latex_response)

        return jsonify({'latex': latex_response, 'text': latex_response}), 200

    except Exception as e:
        print("Error:", e)
        return jsonify({'error': str(e)}), 400





@app.route('/text', methods=['POST'])
@cross_origin()
def image_to_text():
    print("Post Request Received")
    """
    Endpoint to convert an uploaded image to text.

    This function handles POST requests to the /latex URL. It expects a JSON payload
    containing the image data in Base64 format. The image data should be included in 
    the 'uri' field of the JSON object.

    Returns:
        flask.Response: A JSON response with either the extracted text or an error message.
    """

    try:
        # Parse the JSON request body
        data = request.get_json()
        if not data or 'uri' not in data or 'type' not in data or 'name' not in data:
            return jsonify({'error': 'Invalid input data'}), 400

        # Decode the image data from the URI
        image_data = base64.b64decode(data['uri'].split(',')[1])
        image_file = Image.open(io.BytesIO(image_data))
        print('processing image')
        # Process the image
        img = image_processing(image_file)
        
        # Convert the processed image to text format using Tesseract OCR
        
        text_response = pytesseract.image_to_string(img)
        print(text_response)
    except Exception as e:
    
        print("Error:", e)
        traceback.print_exc()
        return jsonify({'error': str(e)}), 400

    
    return jsonify({'text': text_response}), 200
#OpenAI integeration routes


client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    organization=os.getenv("OPENAI_ORGANIZATION")
)

@app.route("/solve-problem", methods=["POST"])
@cross_origin()
def solve_problem():
    try:
        data = request.get_json()
        input_text = data.get("inputText")

        if not input_text:
            return jsonify({"error": "Missing inputText"}), 400

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "user",
                    "content": f"Solve this problem step-by-step: {input_text}",
                }
            ],
            temperature=0.3,
        )

        answer = response.choices[0].message.content or "No answer provided."
        return jsonify({"answer": answer})
    
    except Exception as e:
        print("CRITICAL ERROR IN SOLVE-PROBLEM:")
        print(str(e))            # Prints the short error
        traceback.print_exc()    # Prints the full location of the error
        # ----------------------------------
        return jsonify({"error": str(e)}), 500
    


@app.route("/solve-math", methods=["POST"])
@cross_origin()
def solve_math_problem():
    try:
        data = request.get_json()
        input_text = data.get("inputText")
        
        if not input_text:
            return jsonify({"error": "Missing inputText"}), 400

        # We strictly define the JSON structure we want
        json_structure = """
        {
            "overview": "A brief summary. Use $...$ for math.",
            "steps": [
                {
                    "title": "The Step Title",
                    "content": "Explanation using standard text, but wrap ALL math equations in single dollar signs like $x^2$ or $\\frac{1}{2}$."
                }
            ],
            "finalAnswer": "The final result in math format like $x = 5$"
        }
        """

        prompt = f"""
        You are a helpful math tutor. Solve this problem: "{input_text}".
        
        CRITICAL RULES FOR FORMATTING:
        1.  **Use LaTeX for ALL math expressions.** Never use code syntax like 'x*y' or 'pi/4'.
        2.  **Wrap ALL math in single dollar signs ($).** Example: "The function is $f(x) = x^2$."
        3.   Response must be valid JSON matching this structure: Follow this exact structure:
        {json_structure}
        """

        response = client.chat.completions.create(
            model="gpt-3.5-turbo", # 1106 supports JSON mode well
            response_format={"type": "json_object"}, # FORCE JSON
            messages=[
                {"role": "system", "content": "You are a math solver API that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
        )

        answer_json_string = response.choices[0].message.content
        
        # Parse the string into a real Python dict to ensure it's valid before sending
        answer_data = json.loads(answer_json_string)
        
        return jsonify(answer_data)
    
    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

# ======================================================================
#  QUIZ GENERATION CODE
# ======================================================================
@app.route("/generate-quiz", methods=["POST"])
@cross_origin()
def generate_quiz():
    try:
        data = request.get_json()
        topic = data.get("topic")
        quiz_type = data.get("quizType")
        difficulty = data.get("difficulty")

        if not all([topic, quiz_type, difficulty]):
            return jsonify({"error": "Missing required fields: topic, quizType, difficulty"}), 400

        # Define the expected JSON structure based on the quiz type
        if quiz_type == 'MCQs':
            json_format_instructions = """
            "questions": [
              {
                "question": "The question text...",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": "The text of the correct option"
              }
            ]
            """
        else:  # Short Questions
            json_format_instructions = """
            "questions": [
              {
                "question": "The question text..."
              }
            ]
            """

        # Construct a more robust prompt for the AI model
        prompt = f"""
        Generate a {difficulty} level quiz with 5 questions on the topic of "{topic}".
        The quiz type must be "{quiz_type}".
        Your entire response must be a single, valid JSON object.
        The JSON object must have a single key called "questions", which contains an array of the question objects.
        Do not include any other text, explanations, or markdown.
        Follow this exact structure inside the JSON object:
        {json_format_instructions}
        """

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are an API that generates quizzes in a specified JSON format. You will only respond with the JSON object."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
        )

        quiz_content = response.choices[0].message.content
        print(quiz_content)
    
        try:
            # The AI should return a JSON string. Parse it into a Python object.
            quiz_data = json.loads(quiz_content)
            
            # Now, we specifically look for the "questions" key, which should be a list.
            if isinstance(quiz_data, dict) and "questions" in quiz_data and isinstance(quiz_data["questions"], list):
                # We extract the list of questions and send that back to the client.
                quiz_data = quiz_data["questions"]
                print(quiz_data)
                return jsonify({"quiz": quiz_data}), 200
            else:
                # This error is more specific if the AI fails to follow the new structure.
                raise ValueError("JSON from AI does not contain a 'questions' list.")

        except (json.JSONDecodeError, ValueError) as e:
            print("Error parsing AI response:", e)
            print("Raw AI response received:", quiz_content)
            return jsonify({"error": "Failed to parse the generated quiz from AI."}), 500

    except Exception as e:
        print(f"An unexpected error occurred in /generate-quiz: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

        quiz_data = []
        
        # --- DUMMY DATA FOR TESTING ---
        # if quiz_type == 'MCQs':
        #     quiz_data = [
        #         {
        #             "question": "What is the capital of France?",
        #             "options": ["Berlin", "Madrid", "Paris", "Rome"],
        #             "correctAnswer": "Paris"
        #         },
        #         {
        #             "question": "Which planet is known as the Red Planet?",
        #             "options": ["Earth", "Mars", "Jupiter", "Venus"],
        #             "correctAnswer": "Mars"
        #         },
        #         {
        #             "question": "What is the largest ocean on Earth?",
        #             "options": ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
        #             "correctAnswer": "Pacific Ocean"
        #         },
        #         {
        #             "question": "Who wrote 'Hamlet'?",
        #             "options": ["Charles Dickens", "William Shakespeare", "Leo Tolstoy", "Mark Twain"],
        #             "correctAnswer": "William Shakespeare"
        #         },
        #         {
        #             "question": "What is the chemical symbol for water?",
        #             "options": ["O2", "H2O", "CO2", "NaCl"],
        #             "correctAnswer": "H2O"
        #         }
        #     ]
        # else:  # Short Questions
        #     quiz_data = [
        #         {
        #             "question": "What is the boiling point of water in Celsius?",
        #             "correctAnswer": "100"
        #         },
        #         {
        #             "question": "Who was the first President of the United States?",
        #             "correctAnswer": "George Washington"
        #         },
        #         {
        #             "question": "What is the most spoken language in the world?",
        #             "correctAnswer": "Mandarin Chinese"
        #         },
        #         {
        #             "question": "In which year did the Titanic sink?",
        #             "correctAnswer": "1912"
        #         },
        #         {
        #             "question": "What is the currency of Japan?",
        #             "correctAnswer": "Yen"
        #         }
        #     ]
        

        # return jsonify({"quiz": quiz_data})

    # except Exception as e:
    #     traceback.print_exc()
    #     return jsonify({"error": str(e)}), 500
# ======================================================================
# END: QUIZ GENERATION CODE
# ======================================================================


@app.route("/evaluate-answers", methods=["POST"])
@cross_origin()
def evaluate_answers():
    """
    Receives a batch of questions and answers, gets scores from an AI model,
    and returns the complete, evaluated results.
    """
    print("got request")
    try:
        data = request.get_json()
        # Expecting a structure like: { "answers": [{"question": "...", "answer": "..."}, ...] }
        user_answers = data.get("answers")

        if not user_answers or not isinstance(user_answers, list):
            return jsonify({"error": "Missing or invalid 'answers' field"}), 400

        # Prepare the answers for the prompt in a numbered list format for clarity
        answers_formatted_string = ""
        for i, item in enumerate(user_answers):
            answers_formatted_string += f"{i+1}. Question: {item.get('question')}\n   Answer: {item.get('answer')}\n"

        # Define the expected JSON structure for the AI's response
        json_format_instructions = """
        [
          { "score": <A number from 1 to 5> },
          { "score": <A number from 1 to 5> }
        ]
        """

        # Construct a detailed prompt for the AI model
        prompt = f"""
        I will provide a list of questions and user-submitted answers.
        Evaluate each answer based on its quality and accuracy on a scale of 1 to 5, where 1 is poor and 5 is excellent.
        Your entire response must be a single, valid JSON array of objects, with no other text or explanations.
        The array must have the exact same number of items as the number of answers I provide.
        Follow this exact JSON structure:
        {json_format_instructions}

        Here are the questions and answers to evaluate:
        {answers_formatted_string}
        """

      
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are an API that evaluates quiz answers and returns scores in a specified JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4, # Lower temperature for more deterministic scoring
        )

        evaluation_content = response.choices[0].message.content

        try:
            evaluation_data = json.loads(evaluation_content)
            scores_list = []
            # The model might wrap the list in a key, e.g., {"scores": [...]}. This handles that.
            if isinstance(evaluation_data, dict):
                list_values = [v for v in evaluation_data.values() if isinstance(v, list)]
                if list_values:
                    scores_list = list_values[0]
                else:
                    raise ValueError("JSON from AI is a dictionary but contains no list of scores.")
            elif isinstance(evaluation_data, list):
                scores_list = evaluation_data
            else:
                 raise ValueError("Unexpected JSON format from AI.")

            # Validate that the number of scores matches the number of answers
            if len(scores_list) != len(user_answers):
                 return jsonify({"error": "AI returned a mismatched number of scores."}), 500

            # Combine the original questions and answers with the new scores
            final_results = []
            for i, item in enumerate(user_answers):
                final_results.append({
                    "question": item.get('question'),
                    "answer": item.get('answer'),
                    "score": scores_list[i].get('score', 0) # Default to 0 if score key is missing
                })

            return jsonify(final_results), 200

        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing AI response: {e}")
            print(f"Raw AI response received: {evaluation_content}")
            return jsonify({"error": "Failed to parse the evaluation from AI."}), 500

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500


if __name__ == '__main__':
    app.run(debug=True, host='192.168.0.100', port=5000)
