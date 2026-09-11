import { Link } from 'react-router-dom';
import Button from '../Button.jsx';
import GradientBlob from '../GradientBlob.jsx';
import { Zap } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-24 font-theme">
      <GradientBlob position="right" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Zap className="mx-auto h-8 w-8 text-indigo-300" />
        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Bring your leads, chats and projects into one place today
        </h2>
        <p className="mt-4 text-base text-slate-300">
          Set up takes under a day. No credit card required to start.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/login">
            <Button className="px-6 py-3 text-sm shadow-lg shadow-primary/30">Start free trial</Button>
          </Link>
          <a href="#faq" className="text-sm font-semibold text-white hover:text-slate-200">Read the FAQ</a>
        </div>
      </div>
    </section>
  );
}