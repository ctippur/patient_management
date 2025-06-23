// API for patient management
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Get all patients
exports.getPatients = async (event) => {
  try {
    const params = {
      TableName: 'Patients'
    };
    
    const result = await dynamoDB.scan(params).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(result.Items)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Get patient by ID
exports.getPatientById = async (event) => {
  try {
    const patientId = event.pathParameters.id;
    
    const params = {
      TableName: 'Patients',
      Key: {
        id: patientId
      }
    };
    
    const result = await dynamoDB.get(params).promise();
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({ error: 'Patient not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(result.Item)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Create patient
exports.createPatient = async (event) => {
  try {
    const requestBody = JSON.parse(event.body);
    const { name, dob, email, phone } = requestBody;
    
    if (!name || !dob || !email) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({ error: 'Name, DOB, and Email are required' })
      };
    }
    
    const patientId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const params = {
      TableName: 'Patients',
      Item: {
        id: patientId,
        name,
        dob,
        email,
        phone: phone || null,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    };
    
    await dynamoDB.put(params).promise();
    
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(params.Item)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Update patient
exports.updatePatient = async (event) => {
  try {
    const patientId = event.pathParameters.id;
    const requestBody = JSON.parse(event.body);
    const { name, dob, email, phone } = requestBody;
    
    if (!name || !dob || !email) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({ error: 'Name, DOB, and Email are required' })
      };
    }
    
    const timestamp = new Date().toISOString();
    
    const params = {
      TableName: 'Patients',
      Key: {
        id: patientId
      },
      UpdateExpression: 'set #name = :name, dob = :dob, email = :email, phone = :phone, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': name,
        ':dob': dob,
        ':email': email,
        ':phone': phone || null,
        ':updatedAt': timestamp
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamoDB.update(params).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(result.Attributes)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Delete patient
exports.deletePatient = async (event) => {
  try {
    const patientId = event.pathParameters.id;
    
    const params = {
      TableName: 'Patients',
      Key: {
        id: patientId
      }
    };
    
    await dynamoDB.delete(params).promise();
    
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({})
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};