export default function NotTokenAllowed() {
  return (
    <div className="not-token-allowed">
      <h1>No tokens defined</h1>
      <p>
        You do not have any tokens linked in your application,{" "}
        <a href="http://192.168.3.16:3000/dashboard/settings" target="_blank">
          click here
        </a>{" "}
        to set your token.
      </p>
    </div>
  );
}
