export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <p className="text-sm text-gray-500">
          Age verification powered by{" "}
          <a
            href="https://concordium.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#2B76B9] hover:underline"
          >
            Concordium
          </a>{" "}
          Zero-Knowledge Proofs. No personal data is collected or stored.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          News sourced from GNews and The Guardian Open Platform.
        </p>
      </div>
    </footer>
  );
}
