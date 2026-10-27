# FacePass Project Context & Agent Rules

## Project Overview
FacePass is an AI-powered attendance and course management platform for university lecturers, integrated with AWS Rekognition and companion student portal CoursePass.

## References & Skills
- **Skill**: [.agents/skills/facepass-prd/SKILL.md](.agents/skills/facepass-prd/SKILL.md)
- **PRD Full Text**: [.agents/skills/facepass-prd/references/prd.md](.agents/skills/facepass-prd/references/prd.md)
- **Original Document**: [FacePass PRD.pdf](FacePass%20PRD.pdf)

## Core Architectural Guardrails
1. **Scope Separation**: Student registration and initial biometric enrollment are handled strictly by CoursePass. FacePass handles lecturer course management, scanning, and auditing.
2. **Rekognition Collection Compartmentalization**: Rekognition face collections must be scoped per course.
3. **Privacy**: Biometric images must not be stored on lecturer client devices.
4. **Attendance Threshold**: Calculate student eligibility based on a 75% attendance threshold against the course `total_classes`.
5. **Real-Time Sync**: Trigger asynchronous webhooks to CoursePass when attendance is confirmed.
