import logoImg from '../assets/saarthi-logo-transparent.png';

export default function SaarthiLogo({ size = 64, width }) {
  return (
    <img
      src={logoImg}
      alt="Saarthi Campus"
      className="theme-adaptive-logo"
      style={{
        height: size,
        width: width || 'auto',
        objectFit: width ? 'fill' : 'contain',
      }}
    />
  );
}