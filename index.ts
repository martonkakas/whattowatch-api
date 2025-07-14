import dotenv from 'dotenv';
import express from 'express';
import OpenAI from 'openai';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1'
});

app.post('/api/recommend', async (req: express.Request, res: express.Response) => {
  const { genres, vibe, startYear, endYear } = req.body;
  console.log('Received request with body:', req.body);

  const completion = await client.chat.completions.create({
    model: 'grok-4',
    messages: [
      {
        role: 'system',
        content: 'You are a film recommending AI. Recommend a movie based on the user\'s preferences (e.g., genre, mood, start year - end year).',
      },
      {
        role: 'user',
        content: `Please recommend 3 movies for me which are eligible for the following preferences:
          - Genre: ${genres.length > 0 ? genres.join(', ') : 'any'},
          - Vibe: ${vibe || 'any'},
          - Start Year: ${startYear || 'any'},
          - End Year: ${endYear || 'any'}.
          Your response must be a JSON object with the following structure:
          {
            "recommendations": [
              {
                "title": "Movie Title",
                "plot": "Brief description of the movie plot.",
                "year": 2023,
                "poster": "URL to the movie poster image",
                "imdbId": "tt1234567",
                "imdbUrl": "https://www.imdb.com/title/tt1234567/",
                "genres": ["genre1", "genre2"],
                "duration": "120 min",
              },
              ...
            ]
          }
          The response must only contain the JSON object without any additional text or explanation. If no movies match the criteria, return an empty array in the recommendations field.`
      },
    ],
  });
  const response = completion.choices[0].message.content;

  if (!response) {
    return res.status(400).json({ error: 'No response from AI' });
  }

  return res.json(response);




  //let movies = [];
  //try {
  //  const response = completion.choices[0].message.content;
  //  if (!response) {
  //    return res.status(400).json({ error: 'No response from AI' });
  //  }
  //  const json = JSON.parse(response);
  //
  //  for (const id of json.recommendations) {
  //    const response = await axios.request({
  //      method: 'GET',
  //      url: `https://www.omdbapi.com/?i=${id.imdbId}&apikey=${process.env.OMDB_API_KEY}`
  //    });
  //
  //    movies.push(response.data);
  //  }
  //  return res.json(movies);
  //} catch (error) {
  //  console.error('Error parsing JSON:', error);
  //  return res.status(500).json({ error: 'Failed to parse response from AI' });
  //}
});

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
