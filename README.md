# pennumbra
#### Try it [here](https://pennumbra.vercel.app) (pennumbra.vercel.app)!

---
<img width="1512" height="825" alt="Screenshot 2026-09-05 at 7 28 25 AM" src="https://github.com/user-attachments/assets/ac48dd57-de69-4a58-9d6f-085bbcb27510" />

A sunset and sunrise forecast for Penn Students, plus a few vantage points on & near Penn Campus, sourced by Penn students, to watch dusk/dawn from!

The app uses raw atmospheric data (the HRRR & NAM 3K numeric weather models) to generate a 1-100 score of the sunrise or sunset over campus. As someone who's a HUGE fan of sunrises/sunsets & also someone who's into meteorology, I'll always look up in the sky and come up with my own "best guess" of how good the sunrise/sunset will be - but now, with pennumbra, the open-sourced formula (that I'll keep adjusting, of course, and eventually build a simple neural network for) weighs every atmospheric factor accordingly.

## What it does

**Forecast.** The landing page scores the next sunset (or sunrise, it just picks whichever comes
first, and you can toggle) from four atmospheric inputs:

| Input | Weight | Why |
| --- | --- | --- |
| High cloud cover | 35% | High clouds are usually what capture the scattered sunlight. The best coverage is somewhere around 40-50% |
| Low cloud cover | 25% | Low clouds can block the sun before reaching any high clouds, reducing scattering. Penalized, but future iterations of this formula would also factor in how sometimes low cloud cover can lead to explosive colors. |
| Aerosol optical depth | 20% | Haze scatters out the reds before they arrive |
| Relative humidity | 20% | Damp air mutes color |

The score is computed twice, against two independent NOAA models (HRRR and NAM, aliased in
the UI as the *alpha* and *beta* models for simplicity purposes so as to not confuse the user). How far apart those two land becomes the confidence
rating. The final score maps to a tier (BUST / DUD / MEH / GREAT / BANGER), just so users find it easier to parse the number.

**Vantage points.** A list of places around campus & West Philly to actually watch from, tagged with a photo of the view & some characteristics (the view, whether it's for sunrise/sunset/both, and the crowdedness). For now, the vantage points are stored in a MongoDB database that the app reads.

**Submissions.** Anyone can add a spot through a form with a drag-and-drop photo upload (live
preview, type and size validation, replace/remove). The submission gets added to the MongoDB database, and processed into the vantage points document. 

## Running locally
1. Clone the repository
2. Run `npm install` to download all the dependencies.
3. Set up .env with your own MongoDB credentials (if you want to host it yourself)
4. Run `npm run dev`

## API

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/forecast?lat=&lon=&mode=` | GET | Scored forecast for a location. `mode` is `sunset` or `sunrise`; coordinates default to Penn's campus. Cached for 15 min |
| `/api/spots` | POST | Accepts the submission form as `multipart/form-data`. Validates every field & writes the photo to GridFS and the document to the spots collection |
| `/api/spots/[id]/picture` | GET | Streams a spot's photo out of GridFS with a long immutable cache header |

## Notes

- Submissions are written with `status: "published"`, so they go live immediately. The read
  query in `app/utils/submissions.ts` still filters on that field, so setting new submissions
  back to `"pending"` in `saveSpotSubmission` is all it takes to reinstate a review gate. In the future, I'll add an admin page where submissions can be approved beforehand.
- Forecast responses are cached for 15 minutes; the underlying models update hourly.
- The vantage list renders per request (`dynamic = "force-dynamic"`) so a new submission shows
  up without a rebuild.

## Built with

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · MongoDB with GridFS ·
Open-Meteo (NOAA HRRR and NAM models, plus the air quality API for aerosols)
