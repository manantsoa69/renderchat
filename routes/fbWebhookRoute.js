//routes/fbWebhookRoute.js
const express = require('express');
const router = express.Router();
const { checkSubscription } = require('../helper/subscriptionHelper');
const { sendMessage } = require('../helper/messengerApi');
const { chatCompletion } = require('../helper/openaiApi');
const { checkNumber } = require('./numberValidation');
const axios = require('axios');
async function callChatCompletionService(prompt, fbid) {
  try {
    const complexionServiceUrl = 'https://response-qqh1.onrender.com/generate-response'; 
    
    const response = await axios.post(
      complexionServiceUrl,
      { prompt, fbid },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data; // Assuming the service responds with JSON data
  } catch (error) {
    console.error('Error calling chat completion service:', );
    throw error;
  }
}

// Function to save the response and prompt to Supabase
async function saveResponseToSupabase(prompt, response) {
  try {
    const supabaseUrl = 'https://zqfylsnexoejgcmaxlsy.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZnlsc25leG9lamdjbWF4bHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODkxNjAxMzgsImV4cCI6MjAwNDczNjEzOH0.dlyQU6eqpm14uPceuxZWIWbqWjNUIw9S6YnpXrsqu1k';
    const { error } = await axios.post(
      `${supabaseUrl}/rest/v1/chat_responses`,
      { prompt, response },
      {
        headers: {
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      }
    );

    if (error) {
      console.error('Error saving to Supabase:', error.message);

    }
  } catch (error) {
    console.error('Error occurred while saving to Supabase:', error.message);
  }
}
router.post('/', async (req, res) => {
  try {
    const { entry } = req.body;
    if (entry && entry.length > 0 && entry[0].messaging && entry[0].messaging.length > 0) {
      const { sender: { id: fbid }, message } = entry[0].messaging[0];
      if (message && message.text) {
        let { text: query } = message;
        console.log(`${fbid}`);
        // Check if the message is a number
        if (/^\d+$/.test(query)) {
          const numberValidationResult = await checkNumber(query, fbid);
          await sendMessage(fbid, numberValidationResult);
          console.log('Number message sent:', numberValidationResult);
          return res.sendStatus(200);
        }

        const { Status } = await checkSubscription(fbid);
        if (Status === 'A') {

          try {
            // Call the chatCompletionService function to get the response
            const result = await callChatCompletionService(query, fbid);

              // Save the prompt and response to Supabase
              saveResponseToSupabase(query, result.response);
              // Send the response to the user
              await sendMessage(fbid, result.response);
            
          } catch (error) { 
            await chatCompletion(prompt, fbid);   
            console.log('chat')
          }
        }
      }      
    }
  } catch (error) {
    console.error('Error occurred:', error);
  }

  res.sendStatus(200);
});

// Handle GET requests for verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

module.exports = {
  router,
};
