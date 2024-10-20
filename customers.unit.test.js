// Import required libraries and packages
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { app, server } = require('../../server');
const fs = require('fs').promises;

chai.use(chaiHttp);
const { expect } = chai;

afterEach(() => {
    sinon.restore();  // Restore original behavior after each test
});

// Test module to test the Customers API
describe('Customers API', () => {
    after(async () => {
        await server.close();
    });

    // Test module for GET method
    describe('GET /customers/:id', () => {
        // Test case for retrieving customer detail successfully with provided ID
        it('should return a customer when a valid ID is provided', async () => {
            // Mock the file reading
            sinon.stub(fs, 'readFile').resolves(JSON.stringify([{ employeeId: 34, firstName: 'John', lastName: 'Doe', address: '123 Main St' }]));

            const res = await chai.request(app).get('/customers/34');
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('employeeId', 34);
            expect(res.body).to.have.property('firstName', 'John');
            expect(res.body).to.have.property('lastName', 'Doe');
        });

        // Test case for 400 error when customer not found with Provided ID
        it('should return 400 if no customer is found for the provided ID', async () => {
            sinon.stub(fs, 'readFile').resolves(JSON.stringify([]));

            const res = await chai.request(app).get('/customers/999');
            expect(res).to.have.status(400);
            expect(res.body).to.have.property('message', 'You have supplied invalid request details');
        });

        // Test case for 500 error on file read failure
        it('should return 500 when an error occurs during file read', async () => {
            // Mock readFile to simulate an error
            sinon.stub(fs, 'readFile').rejects(new Error('File read error'));
            const res = await chai.request(app).get('/customers/34');
            expect(res).to.have.status(500);
            expect(res.body).to.have.property('code', 'internalError');
            expect(res.body).to.have.property('message', 'An internal error was encountered processing the request');
            expect(res.body).to.have.property('failures').that.is.an('array').with.lengthOf(1);
            expect(res.body.failures[0]).to.have.property('message', 'File read error');
        });

    });

    // Test module for POST method
    describe('POST /customers', () => {
        // Test case for writing customer detail successfully with provided details 
        it('should create a new customer when valid data is provided', async () => {
            const newCustomer = { firstName: 'Jane', lastName: 'Smith', address: '456 Elm St', employeeId: 2 };
            sinon.stub(fs, 'readFile').resolves(JSON.stringify([]));
            sinon.stub(fs, 'writeFile').resolves();

            const res = await chai.request(app).post('/customers').send(newCustomer);
            expect(res).to.have.status(201);
            expect(res.text).to.equal(`Customer with ID 2 created successfully`);
        });

        // Test case for 400 error when customer exists with the provided ID
        it('should return 400 when customer with the same employee ID exists', async () => {
            const newCustomer = { firstName: 'Jane', lastName: 'Smith', address: '456 Elm St', employeeId: 1 };
            sinon.stub(fs, 'readFile').resolves(JSON.stringify([{ employeeId: 1 }]));

            const res = await chai.request(app).post('/customers').send(newCustomer);
            expect(res).to.have.status(400);
            expect(res.body).to.have.property('message', 'You have supplied invalid request details');
        });

        // Test case for 400 error when input is missing required fields
        it('should return 400 when required fields are missing', async () => {
            const invalidCustomer = { firstName: 'Jane', employeeId: 3 };
            sinon.stub(fs, 'readFile').resolves(JSON.stringify([]));

            const res = await chai.request(app).post('/customers').send(invalidCustomer);
            expect(res).to.have.status(400);
            expect(res.body).to.have.property('message', 'You have supplied invalid request details');
        });

        // Test case for 500 error on file write failure
        it('should return 500 when an error occurs during file write', async () => {
            sinon.stub(fs, 'readFile').resolves(JSON.stringify([]));
            // Mock writeFile to throw an error
            sinon.stub(fs, 'writeFile').rejects(new Error('File write error'));

            const newCustomer = { firstName: 'Jane', lastName: 'Smith', address: '456 Elm St', employeeId: 2 };
            const res = await chai.request(app).post('/customers').send(newCustomer);
            expect(res).to.have.status(500);
            expect(res.body).to.have.property('code', 'internalError');
            expect(res.body).to.have.property('message', 'An internal error was encountered processing the request');
            expect(res.body).to.have.property('failures').that.is.an('array').with.lengthOf(1);
            expect(res.body.failures[0]).to.have.property('message', 'File write error');
        });
    });
});
