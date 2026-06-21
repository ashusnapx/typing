import { Navbar } from '@/components/layout/navbar';
import { APP, WOBBLY_RADII } from '@/lib/config';
import { Mail, MessageCircle, HelpCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-pencil font-marker -rotate-1 mb-8">Contact Us</h1>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: Mail,
              title: 'Email',
              desc: 'For support and feedback',
              action: 'support@mathsmania.com',
              href: 'mailto:support@mathsmania.com',
            },
            {
              icon: MessageCircle,
              title: 'Telegram',
              desc: 'Quick help from our community',
              action: 't.me/mathsmania',
              href: 'https://t.me/mathsmania',
            },
            {
              icon: HelpCircle,
              title: 'FAQ',
              desc: 'Common questions answered',
              action: 'Visit FAQ',
              href: '/blog',
            },
          ].map((item) => (
            <a key={item.title}
               href={item.href}
               target={item.href.startsWith('http') ? '_blank' : undefined}
               rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
               className="bg-white border-2 border-pencil shadow-hard-sm p-6 hover:shadow-hard transition-all -rotate-1 hover:rotate-0"
               style={{ borderRadius: WOBBLY_RADII.md }}>
              <item.icon className="w-8 h-8 text-pencil mb-3" strokeWidth={2.5} />
              <h2 className="text-xl font-bold text-pencil font-marker mb-1">{item.title}</h2>
              <p className="text-sm font-hand text-pencil/60 mb-2">{item.desc}</p>
              <p className="text-base font-hand text-accent underline decoration-wavy underline-offset-2">{item.action}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
