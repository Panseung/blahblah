package com.ssafy.blahblah.db.repository;

import com.ssafy.blahblah.db.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
@Transactional
@Repository
public interface RatingRepository extends JpaRepository<Rating,Long> {
    Optional<Rating> findByUpUserIdAndUserId(Long upUserId, Long userId);
    List<Rating> findAllByUpUserId(Long upUserId);
    void deleteByUpUserIdAndUserId(Long upUserId, Long userId);
    int countByUserId(Long userId);
}
