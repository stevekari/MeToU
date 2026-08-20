import { useLanguage } from '../contexts/LanguageContext';
import chatImg from '../assets/chat.jpeg';

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="app-footer">
      <div className="footer-top-border"></div>
      
      <div className="footer-content">
        <div className="footer-brand">
          {/* <div className="footer-logo">
            <img className="img-round" src={chatImg} alt="GioChat" />
          </div> */}
          <p className="footer-tagline">
            {t('connectTagline')} <br />{t('friendshipTagline')}
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>{t('product')}</h4>
            <a href="/friends">{t('friends')}</a>
            <a href="/settings">{t('settings')}</a>
            <a href="#">{t('features')}</a>
          </div>
          <div className="footer-col">
            <h4>{t('support')}</h4>
            <a href="#">{t('helpCenter')}</a>
            <a href="#">{t('privacy')}</a>
            <a href="#">{t('terms')}</a>
          </div>
        </div>

        <div className="footer-social">
          <h4>{t('stayConnected')}</h4>
          <div className="social-icons">
            <a href="https://github.com/stevekari" aria-label="github"><i className="fa-brands fa-github"></i></a>
            <a href="https://www.linkedin.com/in/stephen-karikari/" aria-label="twitter"><i className="fa-brands fa-x-twitter"></i></a>
            <a href="#" aria-label="linkedin"><i className="fa-brands fa-linkedin"></i></a>
            <a href="#" aria-label="instagram"><i className="fa-brands fa-instagram"></i></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {year} <span className="footer-steve">Steve</span>. {t('allRights')}</p>
        <p className="footer-made">{t('crafted')} <i className="fa-solid fa-heart"></i> by Steve</p>
      </div>
    </footer>
  );
}