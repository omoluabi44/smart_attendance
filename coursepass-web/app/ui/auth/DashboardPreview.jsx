export default function DashboardPreview({ mode }) {
  return (
    <div className="flex min-w-[600px] w-full max-w-md bg-blue-500 h-auto min-h-[590px] mt-5 rounded-lg shadow-md">
      <div className="mt-10 mx-5 text-center gap-10">
        {mode === "login" ? (
          <>
            <h1 className="font-montserrat text-[35px] text-white font-bold">
              Welcome back! Sign in to continue your learning journey on CoursePass.
            </h1>
            <p className="font-montserrat text-white">
              Pick up where you left off and keep building your knowledge.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-montserrat text-[35px] text-white font-bold">
              Join CoursePass today and unlock your personalized learning experience.
            </h1>
            <p className="font-montserrat text-white">
              Create flashcards, track progress, and make studying smarter — all in one place.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
