

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-top-border"></div>
      
      <div className="footer-content">
        <div className="footer-brand">
          <div className="footer-logo">
            <img className='img-round' src="../src/assets/chat.jpeg" alt="giochat" width={100} />
            {/* <span>SteveChat</span> */}
          </div>
          <p className="footer-tagline">
            Connect instantly. Chat securely. <br />Built for real friendships.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>Product</h4>
            <a href="/friends">Friends</a>
            <a href="/settings">Settings</a>
            <a href="#">Features</a>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>

        <div className="footer-social">
          <h4>Stay connected</h4>
          <div className="social-icons">
            <a href="https://github.com/stevekari" aria-label="github"><i className="fa-brands fa-github"></i></a>
            <a href="https://www.linkedin.com/in/stephen-karikari/" aria-label="twitter"><i className="fa-brands fa-x-twitter"></i></a>
            <a href="#" aria-label="linkedin"><i className="fa-brands fa-linkedin"></i></a>
            <a href="#" aria-label="instagram"><i className="fa-brands fa-instagram"></i></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {year} <span className="footer-steve">Steve</span>. All rights reserved.</p>
        <p className="footer-made">Crafted with <i className="fa-solid fa-heart"></i> by Steve</p>
      </div>
    </footer>
  );
}