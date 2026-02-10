import './CategorySection.css';

const categories = [
  { title: 'Fiction', description: 'Twists, turns, and unforgettable protagonists.' },
  { title: 'Business', description: 'Ideas that build better teams and sharper focus.' },
  { title: 'Self-Growth', description: 'Rituals, habits, and stories that inspire change.' },
  { title: 'Design & Art', description: 'Beautiful visuals and creative frameworks.' },
  { title: 'Kids', description: 'Adventure-packed stories for young dreamers.' },
  { title: 'History', description: 'Timelines, culture, and the stories behind them.' }
];

export default function CategorySection() {
  return (
    <section id="categories" className="section category-section">
      <div className="section-header">
        <h2>Shop by category</h2>
        <p>Find the vibe that matches your mood.</p>
      </div>
      <div className="category-grid">
        {categories.map((category) => (
          <article className="category-card" key={category.title}>
            <h3>{category.title}</h3>
            <p>{category.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
