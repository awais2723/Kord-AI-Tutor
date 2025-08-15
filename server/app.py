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

if __name__ == '__main__':
    app.run(debug=True, host='192.168.0.105', port=5000)
