/** True for a 24-hex-char Mongo ObjectId. Guard values before putting them in an API path. */
export function isObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}
