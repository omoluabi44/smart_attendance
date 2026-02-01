import os
import json
import google.generativeai as genai
from pydantic import BaseModel, Field, ValidationError
from uuid import UUID
from typing import List
from google.generativeai import protos



def ai(file_name):
    

    class Outline(BaseModel):
        outlineID: UUID = Field(..., description="Unique ID of the outline using UUID()")
        topic: str = Field(..., description="The topics of the outline in Markdown format")
        orderID: int = Field(..., description="Order number of the outline")
        description: str = Field(..., description="Brief description in Markdown format")

    class YouTubeVideo(BaseModel):
        title: str = Field(..., description="Title of the YouTube video")
        url: str = Field(..., description="YouTube video URL")
        description: str = Field("", description="Optional short description of the video")
    class Concept(BaseModel):
        outlineID: str = Field(..., description="The outline this concept belongs to")
        concept: str = Field(..., description="The concept title in Markdown format")
        content: str = Field(..., description="Detailed content in Markdown format with LaTeX equations ($...$ or $$...$$)")
        youtube: List[YouTubeVideo] = Field(..., description="List of YouTube videos with metadata stored in JSON")
        orderID: int = Field(..., description="Order number of the concept")
    
 
    class Quize(BaseModel):
        incorrect_answers: List[str] = Field(..., description=" this hold three wrong answers")
        explanation: str = Field(..., description="The this explain the answer to the question")
        questionText: str = Field(..., description="this hold the question")
        correct_answer: str = Field(..., description="this hold the correct answer")
        


    class OutlineConcept(BaseModel):
        outline: List[Outline]
        concept: List[Concept]
        quize: List[Quize]


    schema = protos.Schema(
        type=protos.Type.OBJECT,
        properties={
        "outline": protos.Schema(
                type=protos.Type.ARRAY,
                items=protos.Schema(
                    type=protos.Type.OBJECT,
                    properties={
                        "outlineID": protos.Schema(type=protos.Type.STRING),
                        "topic": protos.Schema(type=protos.Type.STRING),
                        "orderID": protos.Schema(type=protos.Type.INTEGER),
                        "description": protos.Schema(type=protos.Type.STRING),
                    },
                required=["outlineID", "topic", "orderID", "description"],
            ),
        ),
        "concept": protos.Schema(
            type=protos.Type.ARRAY,
            items=protos.Schema(
                type=protos.Type.OBJECT,
                properties={
                    "outlineID": protos.Schema(type=protos.Type.STRING),
                    "concept": protos.Schema(type=protos.Type.STRING),
                    "content": protos.Schema(type=protos.Type.STRING),
                    "orderID": protos.Schema(type=protos.Type.INTEGER),
                    "youtube": protos.Schema(
                                type=protos.Type.ARRAY,  # list of videos
                                items=protos.Schema(
                                type=protos.Type.OBJECT,
                                properties={
                                    "title": protos.Schema(type=protos.Type.STRING),
                                    "url": protos.Schema(type=protos.Type.STRING),
                                    "description": protos.Schema(type=protos.Type.STRING),
                },
                required=["title", "url"]  # description optional
            )       
        ),
        
                    },
                    required=["outlineID", "concept", "content", "orderID", "youtube"],
                ),
            ),
            "quize": protos.Schema(
            type=protos.Type.ARRAY,
            items=protos.Schema(
                type=protos.Type.OBJECT,
                properties={
                    "incorrect_answers": protos.Schema(
                            type=protos.Type.ARRAY,
                            items=protos.Schema(type=protos.Type.STRING)
                            ),
                    "explanation": protos.Schema(type=protos.Type.STRING),
                    "questionText": protos.Schema(type=protos.Type.STRING),
                    "correct_answer": protos.Schema(type=protos.Type.STRING),
                },
            required=["incorrect_answers", "explanation", "questionText", "correct_answer"],
            ),
        ),
        },
        required=["outline", "concept", "quize"],
    )

    genai.configure(api_key="AIzaSyB4EDVq8yXPxwRcIe8Ozqg5rdPXYi4gdCU")
    file = genai.upload_file(file_name)
    if not file:
        return("file not found")  


    prompt = """
    You are an assistant that extracts structured lecture notes from the uploaded file.

    Instructions:
    1. Return your response strictly as JSON, following the provided schema.
    2. The `outline` field should contain a list of all major topics found in the document.
    - If there is only one topic, the list should contain a single outline object.
    - If there are multiple topics (two or more), the list should contain one object for each topic.
    3. The `concept` field should contain a list of all concepts. Each concept must be correctly associated with its parent outline using the `outlineID`.
    4. List at least 3 YouTube videos that best explain each concept.
    5. generate atleast 3 Multiple questions for each concept 
    6. The outline should be UUID()
    7. Each field containing text (topic, concept, content, description) must be formatted in **Markdown**:
    - Use `#`, `##`, `###` for headings.
    - Use bullet points, numbered lists, and tables where appropriate.
    - Use **bold** or *italic* for emphasis.
    8. All mathematical equations must be returned in **LaTeX format**:
    - Inline equations: `$...$`
    - Block equations: `$$...$$` (on separate lines).
    9. Do not summarize or paraphrase unnecessarily. Preserve the original content as much as possible.
    """


    # model = genai.GenerativeModel("gemini-1.5-flash-latest")
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(
        [file, prompt],
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json",
            response_schema=schema,
        ),
    )

    # ---------------------------
    # Extract & Validate JSON
    # ---------------------------
    json_output = response.text
 

    try:
        parsed = OutlineConcept.model_validate_json(json_output)
        pretty_json = json.dumps(json.loads(json_output), indent=4, ensure_ascii=False)
    
        with open("output_json.json", 'w') as file:
            file.write(pretty_json)
    except ValidationError as e:
        print("error occured")
        return ("error occured")
    
 
    return pretty_json

