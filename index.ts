import express from 'express';
import OpenAI from 'openai';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1'
});

app.post('/api/recommend', async (req: express.Request, res: express.Response) => {
  const { genres, vibe, startYear, endYear } = req.body;
  console.log('Received request with body:', req.body);

  const sanitizedVibe = vibe ? sanitize(vibe) : '';
  const sanitizedGenres = genres ? genres.sort().map((genre: string) => sanitize(genre)) : [];

  const data = {
    genres: sanitizedGenres.join(', '),
    vibe: sanitizedVibe,
    startYear: startYear ? parseInt(startYear, 10) : undefined,
    endYear: endYear ? parseInt(endYear, 10) : undefined,
  };

  // check data in the database before calling the AI
  // ...

  // if data is found in the database, return it
  // ...

  // if no data is found, proceed to call the AI
  console.log('Calling AI with data:', data);

  const completion = await client.chat.completions.create({
    model: 'grok-3-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a film recommending AI. Recommend a movie based on the user\'s preferences (e.g., genre, mood, start year - end year).',
      },
      {
        role: 'user',
        content: `Please recommend 3 movies which are eligible for the following criteria:
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

  // create the unmatched database entry
  const newData = {
    ...data,
    ...{ movies: [...JSON.parse(response).recommendations] }
  };

  // upload newData to the database
  // ...

  // download the poster images and update the URLs in the response
  // ...

  // save the posters to object storage
  // ...

  return res.json(response);
});

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
