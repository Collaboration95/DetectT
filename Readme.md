# Readme for Detect-T

> A web app implementation of a proof of concept for fit-back ( clothes size recommendation )

> Supposed to access user's device camera , run a model to detect wwhen a person is standing in a T - shape and take a picture + indicate to users .

![Setting up DetectT](https://github.com/Collaboration95/DetectT/blob/main/images/posenet-setup.png?raw=true)

### Things to Do :

- [x] Use a better model (movenet ?)  
- [x] Use pose-detection library instead of poseNet library 
- Write code to get output from skeleton detection model to get a boolean value if the upper body is in frame
- Write UI to indicate that skeleton detection model is in frame
- Try to determine where in the pipeline this would go

### Setup : 

Navigate to root repositiory and run `npm run dev`
