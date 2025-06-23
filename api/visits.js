// API for visit management
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Get visits by patient ID
exports.getVisitsByPatientId = async (event) => {
  try {
    const patientId = event.pathParameters.patientId;
    
    const params = {
      TableName: 'Visits',
      IndexName: 'patientId-index',
      KeyConditionExpression: 'patientId = :patientId',
      ExpressionAttributeValues: {
        ':patientId': patientId
      }
    };
    
    const result = await dynamoDB.query(params).promise();
    
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

// Get visit by ID
exports.getVisitById = async (event) => {
  try {
    const visitId = event.pathParameters.id;
    
    const params = {
      TableName: 'Visits',
      Key: {
        id: visitId
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
        body: JSON.stringify({ error: 'Visit not found' })
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

// Create visit
exports.createVisit = async (event) => {
  try {
    const requestBody = JSON.parse(event.body);
    const { patientId, clinicalExam, instrumentalEvaluation } = requestBody;
    
    if (!patientId || !clinicalExam) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({ error: 'PatientId and clinicalExam are required' })
      };
    }
    
    const visitId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const params = {
      TableName: 'Visits',
      Item: {
        id: visitId,
        patientId,
        date: timestamp,
        clinicalExam,
        instrumentalEvaluation: instrumentalEvaluation || {},
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

// Update visit
exports.updateVisit = async (event) => {
  try {
    const visitId = event.pathParameters.id;
    const requestBody = JSON.parse(event.body);
    const { clinicalExam, instrumentalEvaluation, diagnosis } = requestBody;
    
    const timestamp = new Date().toISOString();
    
    // Build update expression dynamically based on provided fields
    let updateExpression = 'set updatedAt = :updatedAt';
    const expressionAttributeValues = {
      ':updatedAt': timestamp
    };
    
    if (clinicalExam) {
      updateExpression += ', clinicalExam = :clinicalExam';
      expressionAttributeValues[':clinicalExam'] = clinicalExam;
    }
    
    if (instrumentalEvaluation) {
      updateExpression += ', instrumentalEvaluation = :instrumentalEvaluation';
      expressionAttributeValues[':instrumentalEvaluation'] = instrumentalEvaluation;
    }
    
    if (diagnosis) {
      updateExpression += ', diagnosis = :diagnosis, diagnosisStatus = :diagnosisStatus';
      expressionAttributeValues[':diagnosis'] = diagnosis;
      expressionAttributeValues[':diagnosisStatus'] = 'completed';
    }
    
    const params = {
      TableName: 'Visits',
      Key: {
        id: visitId
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
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

// Delete visit
exports.deleteVisit = async (event) => {
  try {
    const visitId = event.pathParameters.id;
    
    const params = {
      TableName: 'Visits',
      Key: {
        id: visitId
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