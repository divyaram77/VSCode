// Import required library and packages
const chai = require('chai');
const chaiHttp = require('chai-http');
const { app, server } = require('../../server');
const expect = chai.expect;
const fs = require('fs').promises;
const path = require('path');

chai.use(chaiHttp);

// Test module to perform end-to-end testing of the API
describe('Customers API Integration Tests', () => {
    // Create a backup file to restore the original file
    const customersFilePath = path.join(__dirname, '../../customers.json');
    const backupFilePath = path.join(__dirname, '../../customers_backup.json');

    // Backup the original file
    before(async () => {
        await fs.copyFile(customersFilePath, backupFilePath);
    });

    // Clear and set up test data before each test
    beforeEach(async () => {
        const initialData = [
            { firstName: 'John', lastName: 'Doe', address: '123 Main St', employeeId: 1 },
            { firstName: 'Jane', lastName: 'Smith', address: '456 Elm St', employeeId: 2 }
        ];
        await fs.writeFile(customersFilePath, JSON.stringify(initialData, null, 2), 'utf8');
    });

    // Restore the original file after each test
    afterEach(async () => {
        await fs.copyFile(backupFilePath, customersFilePath);
    });
    
    // Remove the backup file and close the server after tests
    after(async () => {
        await fs.unlink(backupFilePath); 
        server.close();
    });

    // Testing the GET method
    describe('GET /customers/:id', () => {
        // Test case for retrieving customer detail successfully with provided ID
        it('should return a customer when a valid ID is provided', (done) => {
            chai.request(app)
                .get('/customers/1')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('employeeId', 1);
                    done();
                });
        });

        // Test case for 400 error when customer not found with Provided ID
        it('should return 400 when customer not found', (done) => {
            chai.request(app)
                .get('/customers/9999') // Non-existent ID
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body).to.have.property('code', 'Bad Request');
                    done();
                });
        });

        // Test case for 500 error with invalid data
        it('should return 500 when an error occurs', (done) => {
            // Simulate a read error
            fs.writeFile(customersFilePath, 'not a json', 'utf8')
                .then(() => {
                    chai.request(app)
                        .get('/customers/1') // Trigger error on read
                        .end((err, res) => {
                            expect(res).to.have.status(500);
                            expect(res.body).to.have.property('code', 'internalError');
                            done();
                        });
                });
        });
    });

    // Testing the POST method
    describe('POST /customers', () => {
        // Test case for writing customer detail and retrieving them from the file
        it('should create a new customer when valid data is provided', (done) => {
            const newCustomer = {
                firstName: 'Alice',
                lastName: 'Brown',
                address: '789 Pine St',
                employeeId: 3
            };
            chai.request(app)
                .post('/customers')
                .send(newCustomer)
                .end((err, res) => {
                    expect(res).to.have.status(201);
                    expect(res.text).to.include('Customer with ID 3 created successfully');

                    // Verify that the new customer was added and retrievable
                    chai.request(app)
                        .get('/customers/3') 
                        .end((err, res) => {
                            expect(res).to.have.status(200);
                            expect(res.body).to.have.property('employeeId', 3);
                            done();
                        });
                });
        });

        // Test case for validating duplicate customer insertion
        it('should return 400 when customer with the same employee ID exists', (done) => {
            const duplicateCustomer = {
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                employeeId: 1
            };
            chai.request(app)
                .post('/customers')
                .send(duplicateCustomer)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body).to.have.property('code', 'Bad Request');
                    done();
                });
        });

        // Test case for validating the input for required fields
        it('should return 400 when required fields are missing', (done) => {
            const incompleteCustomer = {
                firstName: 'Jane',
                lastName: 'Doe',
                employeeId: 4 // Missing firstname and address
            };
            chai.request(app)
                .post('/customers')
                .send(incompleteCustomer)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body).to.have.property('code', 'Bad Request');
                    done();
                });
        });

        // Test case for validating the input for required fields and types and checking the error response for all the fields
        it('should return 400 when required fields are missing with all the fields details', (done) => {
            const incompleteCustomer = {
                lastName: 'Doe',
                employeeId: 4 // Missing firstname and address
            };
            chai.request(app)
                .post('/customers')
                .send(incompleteCustomer)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body).to.have.property('code', 'Bad Request');
                    expect(res.body).to.have.property('failures').that.is.an('array').with.lengthOf(2);
                    done();
                });
        });

        // Test case for validating the input for input data types
        it('should return 400 when field types are invalid', (done) => {
            const incompleteCustomer = {
                firstName: 'John',
                lastName: 'Doe',
                address: 123,
                employeeId: '4' // Invalid address and employee id types
            };
            chai.request(app)
                .post('/customers')
                .send(incompleteCustomer)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body).to.have.property('code', 'Bad Request');
                    expect(res.body).to.have.property('failures').that.is.an('array').with.lengthOf(2);
                    expect(res.body.failures[0]).to.have.property('message', 'Address is required and must be a string.');
                    expect(res.body.failures[1]).to.have.property('message', 'Employee ID is required and must be a number.');
                    done();
                });
        });

        // Test case for 500 error on writing improper file
        it('should return 500 when an error occurs', (done) => {
            // Simulate a write error by writing invalid json data
            fs.writeFile(customersFilePath, 'not a json', 'utf8')
                .then(() => {
                    const newCustomer = {
                        firstName: 'Error',
                        lastName: 'Customer',
                        address: 'Somewhere',
                        employeeId: 5
                    };
                    chai.request(app)
                        .post('/customers')
                        .send(newCustomer)
                        .end((err, res) => {
                            expect(res).to.have.status(500);
                            expect(res.body).to.have.property('code', 'internalError');
                            done();
                        });
                });
        });
    });
});

const customersFilePath = './customers.json';
const tempFilePath = path.join(__dirname, '../../customers_temp.json');
// Create a backup file to restore the original file
before(async () => {
    await fs.copyFile(customersFilePath, tempFilePath);
});
// Restore the original file after each test
afterEach(async () => {
    await fs.copyFile(tempFilePath, customersFilePath);
});
// Remove the backup file and close the server
after(async () => {
    await fs.unlink(tempFilePath); 
    server.close();
});

// Test concurrent writes to the customer JSON file
describe('Concurrent Modifications Test', () => {
    // Test case to check concurrent writes to customer json file
    it('should handle concurrent creations and updates without data loss', async () => {
        const initialData = await fs.readFile(customersFilePath, 'utf8');
        const initialCustomers = JSON.parse(initialData);
        const initialLength = initialCustomers.length;

        const newCustomers = [
            { firstName: 'Adam', lastName: 'West', address: '123 Elm St', employeeId: 38 },
            { firstName: 'Bruce', lastName: 'Wayne', address: '456 Wayne Manor', employeeId: 39 },
            { firstName: 'Harry', lastName: 'Potter', address: '789 Private Drive', employeeId: 40 },
            { firstName: 'Hermione', lastName: 'Granger', address: '111 Godrics Hollow', employeeId: 41 },
            { firstName: 'Ron', lastName: 'Weasley', address: '222 Burrow', employeeId: 42 }

        ];

        await Promise.allSettled(newCustomers.map(customer => {
            return chai.request(app)
                .post('/customers')
                .send(customer);
        }));


        // Read the final state of customers.json
        const finalData = await fs.readFile(customersFilePath, 'utf8');
        const finalCustomers = JSON.parse(finalData);

        // Check that the number of customers is correct
        expect(finalCustomers).to.have.lengthOf(initialLength + newCustomers.length);
    });
});
