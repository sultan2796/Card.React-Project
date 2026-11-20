import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";

const API_KEY =
  import.meta.env.VITE_TMDB_API_KEY || "f1b75ac6eb34124e9eb0e7b26da4cc1b";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const FALLBACK_GENRES = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const CATEGORIES = [
  { id: "trending", label: "Trending", endpoint: "trending/movie/week" },
  { id: "popular", label: "Popular", endpoint: "movie/popular" },
  { id: "top_rated", label: "Top Rated", endpoint: "movie/top_rated" },
  { id: "upcoming", label: "Upcoming", endpoint: "movie/upcoming" },
];

const CardSlider = () => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState(FALLBACK_GENRES);
  const [activeCategory, setActiveCategory] = useState("trending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=en-US`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.genres) {
          const map = {};
          data.genres.forEach((g) => {
            map[g.id] = g.name;
          });
          setGenres((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.warn("Could not load genres, using fallback list:", err);
      }
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);

      try {
        const categoryObj =
          CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];
        const res = await fetch(
          `https://api.themoviedb.org/3/${categoryObj.endpoint}?api_key=${API_KEY}&language=en-US&page=1`,
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        const validMovies = (data.results || []).filter(
          (m) => m.poster_path || m.backdrop_path,
        );

        setMovies(validMovies);
      } catch (err) {
        console.error("Error fetching movies:", err);
        setError(
          "Failed to load movies. Please check your internet connection or API key.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [activeCategory]);

  return (
    <main>
      <div className="header-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`tab-btn ${activeCategory === cat.id ? "active" : ""}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="container">
        {loading ? (
          <div className="state-container">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="state-container">
            <p>{error}</p>
            <button
              className="retry-btn"
              onClick={() => setActiveCategory((prev) => prev)}
            >
              Retry
            </button>
          </div>
        ) : (
          <Swiper
            key={activeCategory + movies.length}
            modules={[Pagination]}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView="auto"
            spaceBetween={25}
            speed={700}
            initialSlide={Math.min(2, Math.floor(movies.length / 2))}
            slideToClickedSlide={true}
            pagination={{ el: ".swiper-pagination", clickable: true }}
            breakpoints={{
              320: { spaceBetween: 20 },
              480: { spaceBetween: 25 },
              768: { spaceBetween: 30 },
            }}
          >
            {movies.map((movie) => {
              const posterUrl = movie.poster_path
                ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
                : movie.backdrop_path
                  ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
                  : "";

              const movieGenres = (movie.genre_ids || [])
                .map((id) => genres[id])
                .filter(Boolean)
                .slice(0, 3);

              return (
                <SwiperSlide
                  key={movie.id}
                  className="swiper-slide"
                  style={{
                    backgroundImage: posterUrl ? `url(${posterUrl})` : "none",
                  }}
                >
                  <div className="title">
                    <h1>{movie.title}</h1>
                  </div>

                  <div className="content">
                    <div className="score">
                      {movie.vote_average ? movie.vote_average.toFixed(1) : "—"}
                    </div>

                    <div className="text">
                      <h2>{movie.title}</h2>
                      <p>{movie.overview || "No description available."}</p>
                    </div>

                    {movieGenres.length > 0 && (
                      <div className="genre">
                        {movieGenres.map((genreName, idx) => (
                          <span key={genreName} style={{ "--i": idx + 1 }}>
                            {genreName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              );
            })}
            <div className="swiper-pagination"></div>
          </Swiper>
        )}
      </div>
    </main>
  );
};

export default CardSlider;
