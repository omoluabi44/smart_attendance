import boto3
import os
print("Collection deleted.")
rekognition = boto3.client('rekognition', 
                           region_name='us-east-1',
                           aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                          aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'))



rekognition.delete_collection(CollectionId="Students")
print("Collection deleted.")

    