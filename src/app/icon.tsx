import { renderAppIcon } from "@/lib/app-icon";

export const contentType = "image/png";
export const size = { width: 32, height: 32 };

/** Browser tab favicon. Larger home-screen sizes live in apple-icon + manifest. */
export default function Icon() {
  return renderAppIcon(32);
}
