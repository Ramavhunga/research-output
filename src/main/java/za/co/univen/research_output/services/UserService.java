package za.co.univen.research_output.services;

import org.apache.logging.log4j.util.Base64Util;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import za.co.univen.research_output.dto.Login;
import za.co.univen.research_output.dto.LoginDTO;
import za.co.univen.research_output.dto.SearchUserDTO;
import za.co.univen.research_output.dto.User;

import java.util.Objects;
import java.util.Optional;


@Service
public class UserService {

    private final RestTemplate restTemplate;

    public UserService(RestTemplateBuilder builder ) {
        this.restTemplate = builder.build();
    }

    public LoginDTO itsLogin(User user) throws Exception
    {
        LoginDTO loginDTO = null;
        try
        {
            String userAndPass = user.getUsername()+":"+user.getPassword();
            var headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.add("Authorization","Basic "+ Base64Util.encode(userAndPass));

            ResponseEntity<LoginDTO> rs = restTemplate.exchange("https://univenproduction-integration.azuremicroservices.io/api/user/"+user.getUsername(), HttpMethod.GET, new HttpEntity<>(headers), LoginDTO.class);
            System.out.println("RS  " +rs);
            loginDTO = Objects.requireNonNull(rs.getBody());

            if( rs.getBody() == null )
            {
                throw new SecurityException("Illegal username or password");
            }

        } catch (Exception e)
        {
            e.printStackTrace();
            throw new SecurityException("Illegal username or password");
        }
        return loginDTO;
    }

}
