# Customer management API

Test API to save and retrieve customers from JSON file

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
- [Running Tests](#running-tests)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Creates and runs a customer API to retrieve and save customers to a JSON file with error handling

## Installation

Follow these steps to set up your project locally:

1. Import the project
2. Switch to the directory where the project is imported
3. Install Node js if not already available. To check if Node js is available use the below command
	```bash
	node -v
4. Install the necessary packages with the below command  
	```bash
	npm install chai mocha chai-http sinon express

## Usage

To run the main application either use  
	
	npm start or  
	
	node server
	
The console would infer that the API is running once started

## Running tests

To run the tests for the application, use the below command  
```bash
npm test
```
To test the unit test or integration test separately use the below commands
```bash
npx mocha test/unit/customers.unit.test.js
npx mocha test/integration/customers.integration.test.js
```

It will show the test cases and the result of executing them

### Manual Testing

**1. Prerequisites:**
 - Ensure the application is running
- Use Postman, curl or any similar tools to test the API

**2. Testing Endpoints:** 
 
**- Get By Customer Id**  
Using postman select the GET method and provide this URL - http://localhost:8080/customers/32  
	**Expected Response:**  
	- HTTP Status: 200  
	- Body : { "employeeid": 1, "firstname": "John", "lastname": "Doe", ... }  
	
**- Post new Customer**  
Using postman select the POST method and provide this URL - http://localhost:8080/customers  
Select the type as JSON and provide with the below body  
 {
    "firstname": "Ava",
    "lastname": "King",
    "address": "Test123",
    "employeeid": 51
  }  
	**Expected Response:**  
- HTTP Status: 201
- Body: Customer with ID 51 created successfully

**- Error Handling**
- To test error handling, try accessing a non-existent customer by using this URL - http://localhost:8080/customers/999  
	**Expected Response:**  
	- HTTP Status: 400  
	- Body: { "code": "Bad Request", "You have supplied invalid request details",... }



	
