package com.ssafy.blahblah.api.service.member;

import com.ssafy.blahblah.api.request.member.UserRegisterPostReq;
import com.ssafy.blahblah.db.entity.User;
import com.ssafy.blahblah.db.repository.UserRepository;
import com.ssafy.blahblah.db.repository.UserRepositorySupport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;


/**
 *	유저 관련 비즈니스 로직 처리를 위한 서비스 구현 정의.
 */
@Service("userService")
public class UserServiceImpl implements UserService {
	@Autowired
	UserRepository userRepository;
	
	@Autowired
	UserRepositorySupport userRepositorySupport;
	
	@Autowired
	PasswordEncoder passwordEncoder;
	
	@Override
	public User createUser(UserRegisterPostReq userRegisterInfo) {
		User user = new User();
		String id = userRegisterInfo.getId();
		if (id.isBlank()) {
			id = null;
		}
		user.setUserId(id);
		String nickname = userRegisterInfo.getNickname();
		if (nickname.isBlank()) {
			nickname = null;
		}
		user.setNickname(nickname);
		String email = userRegisterInfo.getEmail();
		if (email.isBlank()) {
			email = null;
		}
		user.setEmail(email);
		user.setAuthority("user");
		user.setCreatedAt(LocalDateTime.now());
		// 보안을 위해서 유저 패스워드 암호화 하여 디비에 저장.
		user.setPassword(passwordEncoder.encode(userRegisterInfo.getPassword()));
		return userRepository.save(user);
	}

	@Override
	public User getUserByUserId(String userId) {
		 //디비에 유저 정보 조회 (userId 를 통한 조회).
		User user = userRepositorySupport.findUserByUserId(userId).get();
		return user;

	}
}
