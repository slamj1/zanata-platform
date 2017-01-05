/*
 * Copyright 2016, Red Hat, Inc. and individual contributors as indicated by the
 * @author tags. See the copyright.txt file in the distribution for a full
 * listing of individual contributors.
 *
 * This is free software; you can redistribute it and/or modify it under the
 * terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This software is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this software; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA, or see the FSF
 * site: http://www.fsf.org.
 */
package org.zanata.action;

import java.io.Serializable;
import java.util.List;
import javax.enterprise.inject.Model;
import javax.faces.bean.ViewScoped;
import javax.inject.Inject;
import javax.inject.Named;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;

import org.apache.commons.lang.RandomStringUtils;
import org.apache.deltaspike.jpa.api.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.zanata.action.validator.NotDuplicateEmail;
import org.zanata.dao.AccountDAO;
import org.zanata.i18n.Messages;
import org.zanata.model.HAccountResetPasswordKey;
import org.zanata.rest.service.AccountService;
import org.zanata.seam.security.IdentityManager;
import org.zanata.service.EmailService;
import org.zanata.service.RegisterService;
import org.zanata.service.UserAccountService;
import org.zanata.ui.faces.FacesMessages;


@Named("adminCreateUserAction")
@ViewScoped
@Model
public class AdminCreateUserAction implements HasUserDetail, Serializable {
    private static final long serialVersionUID = 1L;
    private static final Logger log = LoggerFactory.getLogger(AdminCreateUserAction.class);

    @Inject
    private IdentityManager identityManager;

    @Inject
    private EntityManager entityManager;

    @Inject
    private FacesMessages facesMessages;

    @Inject
    private Messages msgs;

    @Inject
    private EmailService emailServiceImpl;

    @Inject
    private RegisterService registerService;

    @Inject
    private UserAccountService userAccountService;

    @Inject
    private AccountDAO accountDAO;

    private List<String> roles;
    private String username;
    private String email;


    @Transactional
    public String saveNewUser() {
        if (!isNewUsernameValid(getUsername())) {
            facesMessages.addToControl("username",
                    msgs.format("jsf.UsernameNotAvailable",
                            getUsername()));
            return "failure";
        }


        String activationKey =
                registerService.register(username,
                        RandomStringUtils.randomAlphanumeric(8), username,
                        email);
        log.info("get register key:" + activationKey);

        identityManager.grantRoles(username, roles);
        HAccountResetPasswordKey resetPasswordKey =
                userAccountService.requestPasswordReset(username, email);

        String message = emailServiceImpl
                .sendActivationAndResetPasswordEmail(username, email,
                        activationKey, resetPasswordKey.getKeyHash());

        facesMessages.addGlobal(message);

        return "success";
    }

    /**
     * Validate that a user name is not already in the system, by another
     * account
     */
    private boolean isNewUsernameValid(String username) {
        try {
            entityManager
                    .createQuery("from HAccount a where a.username = :username")
                    .setParameter("username", username).getSingleResult();
            return false;
        } catch (NoResultException e) {
            // pass
            return true;
        }
    }

    @Override
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    @NotDuplicateEmail(message = "This email address is already taken.")
    @Override
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
