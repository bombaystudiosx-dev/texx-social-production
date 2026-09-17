export default function FirebaseSetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-lg text-center space-y-4">
        <h1 className="text-2xl font-bold">
          Connect Firebase to run <span className="font-brand tracking-wide">TEXX SOCIAL</span>
        </h1>
        <p className="text-neutral-400">
          This app talks to a real Firebase project for auth, data, and image
          storage — there&apos;s no mocked backend. Create a Firebase project,
          then copy your web app config into{" "}
          <code className="bg-neutral-900 px-1.5 py-0.5 rounded">.env.local</code>{" "}
          (see <code className="bg-neutral-900 px-1.5 py-0.5 rounded">.env.local.example</code>{" "}
          and the README).
        </p>
        <ol className="text-left text-neutral-400 text-sm space-y-1 list-decimal list-inside">
          <li>Create a project at console.firebase.google.com</li>
          <li>Enable Authentication (Email/Password + Google)</li>
          <li>Create a Firestore database</li>
          <li>Enable Storage</li>
          <li>Copy the web app config into .env.local</li>
          <li>Restart the dev server</li>
        </ol>
      </div>
    </div>
  );
}
