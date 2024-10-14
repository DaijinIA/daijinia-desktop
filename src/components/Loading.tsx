type Props = {
  message: string;
};

export default function Loading({ message }: Props) {
  return (
    <div className="loading">
      <img src="/logo.png" />
      <h1>{message}</h1>
    </div>
  );
}
