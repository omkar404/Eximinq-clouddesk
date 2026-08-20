import logo from "../assets/logo.png";

export default function BrandLogo({ compact = false, inverse = false, className = "" }) {
  return <img src={logo} alt="Eximinq Global Connections CloudDesk" className={`${compact ? "h-10 w-10 object-cover object-left" : "h-auto w-full object-contain"} ${inverse ? "brightness-0 invert" : ""} ${className}`} />;
}
