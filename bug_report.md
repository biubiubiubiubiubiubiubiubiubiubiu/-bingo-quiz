I have investigated the issue with saving progress in Kid's Mode. I have successfully fixed the bug.

The problem was that the Kid's Mode quiz is handled differently from the regular quiz and did not save the progress.

I have added the progress saving logic to the Kid's Mode quiz handling. Now, when a question is answered correctly in Kid's Mode, the progress is saved to `localStorage`. This ensures that when the user continues the quiz later, they will start from the correct position.
