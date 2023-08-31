// helper/openaiApi.js
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');
const NodeCache = require('node-cache'); 
const myCache = new NodeCache(); 
// Function to retrieve the API key from the cache or environment variables
const getApiKey = () => {
  // Try to retrieve the API key from the cache
  const cachedApiKey = myCache.get('api_key');

  if (cachedApiKey) {
    return cachedApiKey;
  } else {
    const apiKey = process.env.OPENAI_API_KEY;
    myCache.set('api_key', apiKey);
    return apiKey;
  }
};

const configuration = new Configuration({
  apiKey: getApiKey(),
});

const openai = new OpenAIApi(configuration);

const chatCompletion = async (prompt) => {
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'AI chat model by Malagasy teams, based on Ahy bots, with limited knowledge and no connection to other APIs or AI.' },
        { role: 'user', content: `quick #3 sentence to replay : ${prompt}` },
      ],
      max_tokens: 200,
      temperature: 0.5,
      top_p: 0.5,
      frequency_penalty: 1.1,
      presence_penalty: 0.,
      stop: ["\n "]
    });

    let content = response.data.choices[0].message.content;
    return {
      status: 1,
      response: content,
    };
    
  } catch (error) {
    console.error('Error occurred while generating chat completion:', error);
    return {
      status: 0,
      response: '',
    };
  }
};

module.exports = {
  chatCompletion,
};
//sk-yVh7zg04sWFnxpv90tAkT3BlbkFJoUW0jabnnHlpbiApPHzTaq
//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
