import logoImg from '../assets/saarthi-logo-transparent.png';

export default function SaarthiLogo({ height = 54 }) {
  return <img src={logoImg} alt="Saarthi Campus" style={{ height, width: 'auto', objectFit: 'contain' }} />;
}