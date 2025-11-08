import { LoginForm } from "./LoginForm.component";

export const LoginPage = ({
  title,
  redirectPath = "/dashboard",
}: {
  title?: string;
  redirectPath?: string;
}) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <LoginForm title={title} redirectPath={redirectPath} />
  </div>
);
