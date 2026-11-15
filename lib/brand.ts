/**
 * Nombre de la marca en un solo sitio. Para cambiarlo (por ejemplo al publicar la app),
 * basta con tocar este archivo y, si quieres, los textos de lib/i18n.ts que dicen "en Rela".
 */
export const BRAND = {
  name: "Rela Music",   // nombre completo: título de la web, app, invitaciones
  short: "Rela",        // nombre corto: logo, icono del móvil, frases ("en Rela")
  sub: "Music",         // segunda palabra que acompaña al logo
};

/** Dibuja la marca (cuadrado morado con los cascos) en un canvas, en (x, y) con lado `size`. */
export function drawLogoTile(c: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const k = size / 32;
  c.save(); c.translate(x, y); c.scale(k, k);
  const g = c.createLinearGradient(0, 0, 32, 32); g.addColorStop(0, "#a47dff"); g.addColorStop(1, "#5b2bd6");
  c.fillStyle = g; c.beginPath(); c.roundRect(0, 0, 32, 32, 8.5); c.fill();
  c.translate(0, -0.6); c.strokeStyle = "#fff"; c.fillStyle = "#fff"; c.lineCap = "round";
  c.lineWidth = 2.3; c.stroke(new Path2D("M8.2 18.2a7.8 7.8 0 0 1 15.6 0"));
  c.beginPath(); c.roundRect(5.4, 16.6, 4.8, 9.2, 2.4); c.roundRect(21.8, 16.6, 4.8, 9.2, 2.4); c.fill();
  c.lineWidth = 1.9; c.stroke(new Path2D("M13.4 24.4v-2.6M16 24.4v-6M18.6 24.4v-3.8"));
  c.restore();
}
