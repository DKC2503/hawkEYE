import React, { useState } from 'react';

interface TeamMember {
  name: string;
  role: string;
  imageUrl: string;
}

const teamData: TeamMember[] = [
  {
    name: 'Karthik D',
    role: 'Frontend & Deployment',
    imageUrl: '/team/KARTHIK D.jpeg',
  },
  {
    name: 'Harsha G',
    role: 'Backend & Database',
    imageUrl: '/team/HARSHA G.jpeg',
  },
  {
    name: 'Vignesh N',
    role: 'API & Testing',
    imageUrl: '/team/VIGNESH N.jpeg',
  },
  {
    name: 'Jayanth R',
    role: 'External API & Testing',
    imageUrl: '/team/JAYANTH R.jpeg',
  }
];

export const TeamSection: React.FC = () => {
  return (
    <section className="relative z-20 w-full py-16 md:py-24 px-4 md:px-12 lg:px-16 mt-auto bg-black/40 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-light tracking-[0.2em] text-white uppercase mb-3">
            Our Team
          </h2>
          <p className="text-sm md:text-base font-medium tracking-[0.1em] text-white/50 uppercase">
            The people behind hawkEYE.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 w-full">
          {teamData.map((member) => (
            <TeamCard key={member.name} member={member} />
          ))}
        </div>

        {/* Closing Line */}
        <div className="mt-16 text-center">
          <p className="text-xs md:text-sm font-medium tracking-[0.15em] text-white/30 uppercase">
            &ldquo;Built together. Built for better cities.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
};

const TeamCard: React.FC<{ member: TeamMember }> = ({ member }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="liquid-glass group relative flex flex-col items-center p-6 rounded-[24px] transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 border border-white/10 hover:border-white/20">
      {/* Avatar */}
      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-6 border-2 border-white/10 shadow-xl bg-black/50 flex items-center justify-center">
        {!imgError ? (
          <img 
            src={member.imageUrl} 
            alt={member.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', borderRadius: '50%' }}
            className="grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#101820] text-white text-2xl font-light rounded-full">
            {member.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className="text-lg md:text-xl font-medium text-white mb-1 tracking-wide">
          {member.name}
        </h3>
        <p className="text-xs md:text-sm text-emerald-400/80 font-medium tracking-wider uppercase">
          {member.role}
        </p>
      </div>
    </div>
  );
};
