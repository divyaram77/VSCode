// Importing required libraries and packages
const fs = require('fs').promises;
const express = require('express');
const app = express();
app.use(express.json());

// Lock mechanism to handle concurrent write requests
let isLocked = false;

// Function to acquire a lock
const acquireLock = async () => {
    while (isLocked) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Wait 50ms
    }
    isLocked = true;
};

// Function to release a lock
const releaseLock = () => {
    isLocked = false;
};

// Reusable function to read the Customers.json file
async function readCustomersFile() {
    const data = await fs.readFile(__dirname + "/customers.json", 'utf8');
    return JSON.parse(data);
};

// Reusable function to write to the Customers.json file
async function writeCustomersFile(data) {
    await fs.writeFile(__dirname + "/customers.json", JSON.stringify(data, null, 2), 'utf8');
};

// GET method to retrieve customer details from the JSON file
app.get('/customers/:id', async function (req, res, next) {
    try {
        const customers = await readCustomersFile();
        const customer = customers.find(c => c.employeeId === parseInt(req.params.id));

        //Validation to check customer existence
        if (!customer) {
            return sendErrorResponse(res, 400, 'You have supplied invalid request details', [{ name: 'Validation Error', message: 'Customer Not found' }]);
        }

        //Returning the customer details if it exists
        res.json(customer);
    }
    catch (err) {
        next(err);   // Pass error to the middleware exception handler
    }
})

// POST method to save customer details to the JSON file 
app.post('/customers', async (req, res, next) => {
    try {
        await acquireLock();  // Acquire lock for writing
        const customers = await readCustomersFile();
        const { firstName, lastName, address, employeeId } = req.body;
        const newCust = { firstName, lastName, address, employeeId };

        // Validate input customer data
        const errors = validateCustomerData(newCust,customers);
        if (errors.length > 0) {
            const errArray = errors.map(error => ({
                name: 'Validation Error',
                message: error,
            }));
            return sendErrorResponse(res, 400, 'You have supplied invalid request details', errArray);
        }
        // Once validation is successful add the new customer to the file
        customers.push(newCust);
        await writeCustomersFile(customers);
        res.status(201).send(`Customer with ID ${employeeId} created successfully`);
    }
    catch (err) {
        next(err);  // Pass error to the middleware exception handler
    }
    finally {
        releaseLock();  // Release the acquired lock
    }
});

// Function to validate input customer data
function validateCustomerData(customer, existingCustomers) {
    const errors = [];
    const existingCustomer = existingCustomers.find(c => c.employeeId === customer.employeeId);

    if (existingCustomer) {
        errors.push(`Customer with employee Id ${customer.employeeId} exists`);
    }
    if (!customer.firstName || typeof customer.firstName !== 'string') {
        errors.push('Firstname is required and must be a string');
    }
    if (!customer.lastName || typeof customer.lastName !== 'string') {
        errors.push('Last name is required and must be a string.');
    }
    if (!customer.address || typeof customer.address !== 'string') {
        errors.push('Address is required and must be a string.');
    }
    if (!customer.employeeId || typeof customer.employeeId !== 'number') {
        errors.push('Employee ID is required and must be a number.');
    }
    return errors;
}

// Middleware exception handler to handle implicit or explicitly thrown exceptions
app.use((err, req, res, next) => {
    const errArray = [{
        message: err.message,
        name: err.name,
    }];
    sendErrorResponse(res, 500, 'An internal error was encountered processing the request', errArray);
});

// Function to send error responses
function sendErrorResponse(res, respStatus, respMessage, respFailure = []) {
    const currentTime = getFormattedDateTime();
    const respBody = {
        code: respStatus === 400 ? 'Bad Request' : 'internalError',
        httpStatus: respStatus,
        message: respMessage,
        serverDateTime: currentTime,
        failures: respFailure.length > 0 ? respFailure : '[]',
    };
    return res.status(respStatus).json(respBody);
}

// Function to format the current date and time with timezone offset
function getFormattedDateTime() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    // Timezone offset
    const timezoneOffset = -date.getTimezoneOffset();
    const timezoneSign = timezoneOffset >= 0 ? '+' : '-';
    const timezoneHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
    const timezoneMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${timezoneSign}${timezoneHours}${timezoneMinutes}`;
}

// Create and start the server at 8080
var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port
    console.log(host);
    console.log("REST API is running on port", port);
})
module.exports = { app, server };
