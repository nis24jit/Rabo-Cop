# Rabo-Cop
An app to parse and validate CSV/Xml files against predefined criteria.

Steps to run the app.

Clone or download the repo.

Navigate to the Rabo-Cop folder and run the following commands

a) sudo npm install

b) bower install

c) grunt serve

Launch the app at the following URL

http://localhost:9000/#/

To run the Unit tests.

a)npm test.

Patterns and practices.

The app leverages on the module revealing pattern as well as the usage IIFE to encapsulate as well as separate the concerns between different parts of the app.

The app is under unit test and assertions have been made against mock data.

Care has been made to sanitize the objects according to the criteria.

Exception handling mechanism's are in place for handling redundant as well data that is wrong.

Tools and Technologies

a)Angular.js 

b)Grunt as the task manager

c)Jasmine and karma for unit tests

d)Bootstrap for styling

e)Yeoman for scaffolding

f)ng doc for documentation


Style guide.

john papa style guide foe angular 1

Please refer to the screen shots for further reference.

Scope for enhancement.

1)Provide visualization using D3.js or any visulalization framework on the errors.
2)Export the error report.
3)Mailing functionality.
4)Validating multiple files at the same time.



