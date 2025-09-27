import React from 'react';

interface CertificateProps {
  logoUrl: string | null;
  certificateTitle: string;
  certificateBody: string;
  participantName: string;
  eventName: string;
  eventDate: Date;
  signatoryName: string;
  signatoryTitle: string;
}

const CertificateGraphic = () => (
    <svg width="100" height="100" viewBox="0 0 200 200" className="h-24 w-24 mx-auto mb-2 text-gray-700">
        <defs>
            <path id="circlePath" d="M 50, 100 A 50,50 0 1,1 150,100 A 50,50 0 1,1 50,100" />
        </defs>
        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
        <text fill="currentColor" fontSize="16" fontWeight="bold" letterSpacing="3">
            <textPath xlinkHref="#circlePath" startOffset="50%" textAnchor="middle">
                YOUNG INVESTORS NETWORK
            </textPath>
        </text>
        <g transform="translate(100, 100) scale(0.5)">
           <path fill="currentColor" d="M16 15.503A2.5 2.5 0 0 1 13.5 18h-11A2.5 2.5 0 0 1 0 15.503V2.497A2.5 2.5 0 0 1 2.5 0h11A2.5 2.5 0 0 1 16 2.497zM2.5 1A1.5 1.5 0 0 0 1 2.497v13.006A1.5 1.5 0 0 0 2.5 17h11a1.5 1.5 0 0 0 1.5-1.497V2.497A1.5 1.5 0 0 0 13.5 1z M8 8.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5m3.5 2.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5m-7-1a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5"/>
        </g>
    </svg>
);


export const Certificate: React.FC<CertificateProps> = ({
  logoUrl,
  certificateTitle,
  certificateBody,
  participantName,
  eventDate,
  signatoryName,
  signatoryTitle,
}) => {
  return (
    <div
      className="bg-white text-black w-full h-full p-4 relative"
      style={{ fontFamily: "'Garamond', serif" }}
    >
      {/* Borders */}
      <div className="absolute inset-0 border-8 border-gray-700"></div>
      <div className="absolute inset-0 border-2 border-gray-400 m-3"></div>

      {/* Content container */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-8">
        <div className="text-center w-full">
            {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-24 mx-auto mb-4 object-contain" />
            ) : (
                <CertificateGraphic />
            )}
            <h1 className="text-5xl font-bold mt-2 text-blue-900" style={{ fontFamily: "'Cinzel', serif" }}>
                {certificateTitle}
            </h1>
        </div>

        <div className="text-center my-6">
            <p className="text-xl text-gray-700">This is to certify that</p>
            <p className="text-4xl font-semibold my-4 text-black border-b-2 border-gray-400 pb-2 px-4">
                {participantName}
            </p>
            <div
                className="text-xl text-gray-800 max-w-3xl mx-auto"
                dangerouslySetInnerHTML={{ __html: certificateBody }}
            />
            <p className="text-lg text-gray-600 mt-4">
                Awarded on {eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
        </div>

        <div className="text-center w-full mt-auto pt-6">
            <p className="text-2xl font-semibold italic" style={{ fontFamily: "'Brush Script MT', cursive" }}>{signatoryName}</p>
            <hr className="border-t-2 border-gray-700 w-64 mt-1 mx-auto" />
            <p className="text-lg text-gray-600">{signatoryTitle}</p>
        </div>
      </div>
    </div>
  );
};
