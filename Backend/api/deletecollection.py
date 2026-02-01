import boto3
import os

# Ensure REKOGNITION_COLLECTION_ID is set in your environment
client = boto3.client('rekognition')
client.delete_collection(CollectionId=os.environ['REKOGNITION_COLLECTION_ID'])
print("Collection deleted.")