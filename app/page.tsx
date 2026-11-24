import LoginForm from "./components/login/LoginForm";


export default function HomePage() {
  return (
    <main
      className="min-h-dvh w-full overflow-x-hidden overflow-y-auto flex items-center justify-center px-4 py-8 sm:p-6 relative bg-slate-950"
      style={{
        backgroundImage: `radial-gradient(circle at center, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.95) 100%), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%232e3b4e' fill-opacity='0.08'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40z'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* Halo doré contenu sans débordement */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-72 h-72 sm:w-[500px] sm:h-[500px] bg-amber-500/5 rounded-full blur-[80px] sm:blur-[110px]" />
      </div>

      <div className="relative z-10 w-full flex justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
