from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from PIL import Image
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

        if img.ndim == 2:  # Grayscale image
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

@app.route('/')
@cross_origin()
def home():
    """
    Home route for the application.

    Returns:
        str: A string indicating that the server is running.
    """
    return 'Server is running!'

@app.route('/latex', methods=['POST'])
@cross_origin()
def image_to_latex():
    """
    Endpoint to convert an uploaded image to LaTeX.

    This function handles POST requests to the /latex URL. It expects a JSON payload
    containing the image data in Base64 format. The image data should be included in 
    the 'uri' field of the JSON object.

    Returns:
        flask.Response: A JSON response with either the LaTeX code or an error message.
    """

    try:
        # Parse the JSON request body
        data = request.get_json()
        if not data or 'uri' not in data or 'type' not in data or 'name' not in data:
            return jsonify({'error': 'Invalid input data'}), 400

        # Decode the image data from the URI
        image_data = base64.b64decode(data['uri'].split(',')[1])
        image_file = Image.open(io.BytesIO(image_data))

        # Process the image
        img = image_processing(image_file)

        # Convert the image to LaTeX format using the model
        latex_response = model(img)
        
        # Convert LaTeX to plain text
        text_response = LatexNodes2Text().latex_to_text(latex_response)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
    return jsonify({'latex': latex_response, 'text': text_response}), 200

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

OPENAI_API_KEY = "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"
OPENAI_ORG_ID = "org-urd4KrI8gjWN4Km3oZfK22Rg"

client = OpenAI(api_key=OPENAI_API_KEY, organization=OPENAI_ORG_ID)

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
        return jsonify({"error": str(e)}), 500
    
# ======================================================================
# START: NEW QUIZ GENERATION CODE
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
            [
              {
                "question": "The question text...",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": "The text of the correct option"
              }
            ]
            """
        else:  # Short Questions
            json_format_instructions = """
            [
              {
                "question": "The question text...",
                
              }
            ]
            """

        # Construct a detailed prompt for the AI model
        # prompt = f"""
        # Generate a {difficulty} level quiz with 5 questions on the topic of "{topic}".
        # The quiz type must be "{quiz_type}".
        # Your entire response must be a single, valid JSON array, with no other text or explanations.
        # Follow this exact JSON structure:
        # {json_format_instructions}
        # """

        # response = client.chat.completions.create(
        #     model="gpt-3.5-turbo",  # Using a model that supports JSON mode
        #     response_format={"type": "json_object"},
        #     messages=[
        #         {"role": "system", "content": "You are an API that generates quizzes in a specified JSON format."},
        #         {"role": "user", "content": prompt}
        #     ],
        #     temperature=0.6,
        # )

        # quiz_content = response.choices[0].message.content
   
        # The AI should return a JSON string. Parse it into a Python object.
        # try:
        #     quiz_data = json.loads(quiz_content)
        #     # Sometimes the model wraps the list in a key, like {"questions": [...]}. Let's find the list.
        #     if isinstance(quiz_data, dict):
        #         list_values = [v for v in quiz_data.values() if isinstance(v, list)]
        #         if list_values:
        #             quiz_data = list_values[0] # Take the first list found
        #         else:
        #             raise ValueError("JSON from AI is a dictionary but contains no list of questions.")
        # except (json.JSONDecodeError, ValueError) as e:
        #     print("Error parsing AI response:", e)
        #     print("Raw AI response received:", quiz_content)
        #     return jsonify({"error": "Failed to parse the generated quiz from AI."}), 500

        quiz_data = []
        
        # --- DUMMY DATA FOR TESTING ---
        if quiz_type == 'MCQs':
            quiz_data = [
                {
                    "question": "What is the capital of France?",
                    "options": ["Berlin", "Madrid", "Paris", "Rome"],
                    "correctAnswer": "Paris"
                },
                {
                    "question": "Which planet is known as the Red Planet?",
                    "options": ["Earth", "Mars", "Jupiter", "Venus"],
                    "correctAnswer": "Mars"
                },
                {
                    "question": "What is the largest ocean on Earth?",
                    "options": ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
                    "correctAnswer": "Pacific Ocean"
                },
                {
                    "question": "Who wrote 'Hamlet'?",
                    "options": ["Charles Dickens", "William Shakespeare", "Leo Tolstoy", "Mark Twain"],
                    "correctAnswer": "William Shakespeare"
                },
                {
                    "question": "What is the chemical symbol for water?",
                    "options": ["O2", "H2O", "CO2", "NaCl"],
                    "correctAnswer": "H2O"
                }
            ]
        else:  # Short Questions
            quiz_data = [
                {
                    "question": "What is the boiling point of water in Celsius?",
                    "correctAnswer": "100"
                },
                {
                    "question": "Who was the first President of the United States?",
                    "correctAnswer": "George Washington"
                },
                {
                    "question": "What is the most spoken language in the world?",
                    "correctAnswer": "Mandarin Chinese"
                },
                {
                    "question": "In which year did the Titanic sink?",
                    "correctAnswer": "1912"
                },
                {
                    "question": "What is the currency of Japan?",
                    "correctAnswer": "Yen"
                }
            ]
        

        return jsonify({"quiz": quiz_data})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
# ======================================================================
# END: NEW QUIZ GENERATION CODE
# ======================================================================


if __name__ == '__main__':
    app.run(debug=True, host='192.168.0.105', port=5000)
