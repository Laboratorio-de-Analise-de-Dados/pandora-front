// jest-dom adds custom matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom"

// jsdom does not implement URL.createObjectURL, which plotly.js calls at import
// time. Provide a no-op so components depending on plotly can be tested.
if (typeof URL.createObjectURL === "undefined") {
	Object.defineProperty(URL, "createObjectURL", {
		writable: true,
		value: () => "",
	})
}
