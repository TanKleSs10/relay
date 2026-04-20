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
      <footer className="app-footer">
        <p className="app-footer__text">
          Desarrollado por{" "}
          <a
            className="app-footer__link"
            href="https://diegomeza.tech"
            target="_blank"
            rel="noreferrer"
          >
            Diego Meza
          </a>
        </p>
      </footer>
    </div>
  )
}
