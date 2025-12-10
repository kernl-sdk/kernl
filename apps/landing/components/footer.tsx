const navLinks = [
  { href: "#", label: "Contact" },
  { href: "https://docs.kernl.sh", label: "Docs" },
];

function Signature() {
  return (
    <svg
      width="57"
      height="27"
      viewBox="0 0 57 27"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M26.6303 0.5C25.5145 3.13292 24.3988 5.76584 22.9591 8.12168C21.5194 10.4775 19.7896 12.4765 17.0291 14.9856C14.2686 17.4948 10.5298 20.4535 7.85172 22.4416C3.7575 25.4809 1.64965 26.4882 0.965161 26.4998C-0.921954 26.5318 3.35154 21.9716 6.28641 19.1382C7.94868 17.5334 10.17 15.8143 12.5789 14.1095C14.9877 12.4048 17.5698 10.824 20.4348 9.35604C23.2998 7.88805 26.3693 6.58078 29.8225 5.40849C33.2757 4.23619 37.0194 3.2385 38.5622 3.11884C40.1051 2.99918 39.3335 3.78779 36.7163 6.11342C34.0991 8.43904 29.6595 12.2778 26.9901 14.6687C23.4848 17.8083 22.6374 18.9818 22.597 19.3577C22.4402 20.8146 27.3091 17.5515 29.7351 15.6445C30.1481 15.3199 30.2829 15.0458 30.0403 15.0287C27.3776 14.8407 25.1969 17.5255 24.4563 18.255C24.1757 18.5314 24.2604 18.7697 24.6011 18.904C25.5302 19.2703 29.0617 18.9681 33.2314 18.7924C34.5756 18.7357 34.3571 19.0558 34.2867 19.3241C34.2163 19.5925 34.3016 19.8789 34.7555 20.1831C35.2094 20.4872 36.0294 20.8003 37.7774 21.0392C39.5253 21.2781 42.1764 21.4333 44.6572 21.4175C47.138 21.4017 49.3684 21.2103 51.1724 20.9581C52.9763 20.7059 54.2864 20.3987 55.1038 20.1652C55.9212 19.9318 56.2063 19.7814 56.5 19.6265"
        stroke="#B5D6FB"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CornerPlus({ className }: { className?: string }) {
  return (
    <span className={`text-muted-foreground/30 text-2xl select-none ${className}`}>
      +
    </span>
  );
}

export function Footer() {
  return (
    <footer className="w-full px-6 py-10">
      <div className="relative mx-auto flex max-w-md flex-col gap-48 px-8 py-16 sm:max-w-lg md:max-w-2xl md:px-12 lg:max-w-3xl xl:max-w-5xl lg:px-16 min-[1624px]:max-w-6xl min-[1900px]:max-w-7xl">
        <CornerPlus className="absolute top-0 left-0" />
        <CornerPlus className="absolute top-0 right-0" />
        <CornerPlus className="absolute bottom-0 left-0" />
        <CornerPlus className="absolute bottom-0 right-0" />

        <div className="flex justify-between">
          <div className="flex flex-col gap-4">
            <span className="font-mono text-sm text-brand">kernl</span>
            <p className="text-sm text-foreground">
              The runtime for software 3.0.
            </p>
          </div>

          <nav className="flex flex-col items-end gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="group relative text-sm text-steel"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 h-px w-full bg-steel/20" />
                <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-steel/60 transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-end justify-between">
          <p className="text-sm font-medium text-foreground">
            Digital Automata, Inc.<span className="ml-2">© 2025</span>
          </p>
          <Signature />
        </div>
      </div>
    </footer>
  );
}
