/*
 * Copyright 2012, Red Hat, Inc. and individual contributors as indicated by the
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
package org.zanata.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OrderColumn;

import org.hibernate.annotations.ListIndexBase;
import org.hibernate.validator.constraints.NotEmpty;
import org.zanata.common.DocumentType;
import io.leangen.graphql.annotations.GraphQLIgnore;

@Entity
@GraphQLIgnore
public class HDocumentUpload extends ModelEntityBase implements Serializable {
    private static final long serialVersionUID = 1L;
    private HProjectIteration projectIteration;
    private String docId;
    private DocumentType type;
    private HLocale locale;
    private String contentHash;
    private List<HDocumentUploadPart> parts;

    public HDocumentUpload() {
        // hibernate requires this to be an ArrayList
        parts = new ArrayList<HDocumentUploadPart>();
    }

    public void setId(Long id) {
        super.setId(id);
    }

    @ManyToOne
    @JoinColumn(name = "projectIterationid", nullable = false)
    public HProjectIteration getProjectIteration() {
        return projectIteration;
    }

    @NotEmpty
    public String getDocId() {
        return docId;
    }

    @Enumerated(EnumType.STRING)
    public DocumentType getType() {
        return type;
    }
    // null for source document upload

    @ManyToOne
    @JoinColumn(name = "localeId", nullable = true)
    public HLocale getLocale() {
        return locale;
    }

    @NotEmpty
    @Column(columnDefinition = "char(32)")
    public String getContentHash() {
        return contentHash;
    }

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "documentUploadId", nullable = false)
    @OrderColumn(name = "partIndex", nullable = false)
    @ListIndexBase
    public List<HDocumentUploadPart> getParts() {
        return parts;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + "@"
                + Integer.toHexString(hashCode()) + "[id=" + id + ",versionNum="
                + versionNum + ",contentHash=" + contentHash + "]";
    }

    public void setProjectIteration(final HProjectIteration projectIteration) {
        this.projectIteration = projectIteration;
    }

    public void setDocId(final String docId) {
        this.docId = docId;
    }

    public void setType(final DocumentType type) {
        this.type = type;
    }

    public void setLocale(final HLocale locale) {
        this.locale = locale;
    }

    public void setContentHash(final String contentHash) {
        this.contentHash = contentHash;
    }

    public void setParts(final List<HDocumentUploadPart> parts) {
        this.parts = parts;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;

        HDocumentUpload that = (HDocumentUpload) o;

        if (projectIteration != null ?
                !projectIteration.equals(that.projectIteration) :
                that.projectIteration != null) return false;
        if (docId != null ? !docId.equals(that.docId) : that.docId != null)
            return false;
        if (type != that.type) return false;
        if (locale != null ? !locale.equals(that.locale) : that.locale != null)
            return false;
        if (contentHash != null ? !contentHash.equals(that.contentHash) :
                that.contentHash != null) return false;
        return parts != null ? parts.equals(that.parts) : that.parts == null;
    }

    @Override
    public int hashCode() {
        int result = super.hashCode();
        result = 31 * result +
                (projectIteration != null ? projectIteration.hashCode() : 0);
        result = 31 * result + (docId != null ? docId.hashCode() : 0);
        result = 31 * result + (type != null ? type.hashCode() : 0);
        result = 31 * result + (locale != null ? locale.hashCode() : 0);
        result = 31 * result +
                (contentHash != null ? contentHash.hashCode() : 0);
        result = 31 * result + (parts != null ? parts.hashCode() : 0);
        return result;
    }
}
