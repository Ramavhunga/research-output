package za.co.univen.research_output.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.univen.research_output.entities.User;

import java.util.Optional;

@Repository
public interface UserRepository  extends JpaRepository<User, Long> {

}
