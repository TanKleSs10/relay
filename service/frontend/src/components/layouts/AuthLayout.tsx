import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div>
      <header className="header">
        <div className="header__container">
          <h1 className="header__title">⚡ Relay</h1>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  )
}
