<%@ Page Title=".:Profiles Roles:." Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="ProfilesRoles.aspx.vb" Inherits="ProfilesRoles" %>
<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
     <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <table>
                <tr>
                    <td style="height: 16px" colspan="3">&nbsp;</td>
                </tr>
                <tr>
                    <td><strong><span style="font-size: 10pt; color: #153e7e">Profile Name</span></strong></td>
                    <td>
                            <asp:DropDownList ID="DropDownProfile" runat="server" Width="256px" BackColor="White"
                                Font-Size="Small" AutoPostBack="True" CssClass="tinyText">
                            </asp:DropDownList>
                        </td>
                        <td style="width: 264px; height: 16px">
                            <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" Width="232px"
                                Font-Size="Small" ControlToValidate="DropDownProfile" ErrorMessage="Please Select a Profile Before Proceeding"></asp:RequiredFieldValidator>
                        </td>
                </tr>
                <tr>
                    <td colspan="3" align="right">
                        <asp:Button ID="BtnSave" runat="server" Text="Save Roles" CssClass="box1" />
                    </td>
                </tr>
                <tr>
                    <td colspan="3">&nbsp;</td>
                </tr>                
                <tr>
                    <td colspan="3">
                        <asp:Label ID="LblInfo" runat="server" Text="" ForeColor="Red"></asp:Label></td>
                </tr>
                <tr>
                    <td colspan="3"><hr style="border-color:Teal;" /></td>
                </tr>
                <tr>
                    <td colspan="3">
                        <fieldset style="min-height:100px;">
                            <legend class="tinyManText">User Roles</legend>
                            <asp:GridView ID="GridView1" runat="server" AutoGenerateColumns="False" Width="600px" 
                                BackColor="White" BorderColor="#3366CC" BorderStyle="None" BorderWidth="1px" 
                                CellPadding="4" EmptyDataText="No Records Found.">
                                <RowStyle BackColor="White" ForeColor="#003399" />
                                <Columns>
                                    <asp:BoundField DataField="SubMenuName" HeaderText="Menu Item" />
                                    <asp:TemplateField ItemStyle-HorizontalAlign="Center">
                                        <HeaderTemplate>
                                            <asp:CheckBox ID="ChkAddAll" runat="server"  Text="Add" AutoPostBack="true" OnCheckedChanged="CheckAcceptAll"/>                                         
                                        </HeaderTemplate>
                                        <ItemTemplate>
                                            <asp:CheckBox ID="ChkAdd" runat="server"  onclick='Check_Click_Cell(this)' />
                                               <asp:HiddenField ID="HiddenField1" runat="server" Value='<%# eval("MENUACCESSID") %>' />
                                        </ItemTemplate>
                                    </asp:TemplateField>
                                    <asp:TemplateField ItemStyle-HorizontalAlign="Center">
                                        <HeaderTemplate>
                                            <asp:CheckBox ID="ChkEditAll" runat="server"  Text="Edit" AutoPostBack="true" OnCheckedChanged="CheckAcceptEdit"/>
                                        </HeaderTemplate>
                                        <ItemTemplate>
                                            <asp:CheckBox ID="ChkEdit" runat="server"  onclick='Check_Click_Cell(this)' />
                                        </ItemTemplate>
                                    </asp:TemplateField>
                                    <asp:TemplateField ItemStyle-HorizontalAlign="Center">
                                        <HeaderTemplate>
                                            <asp:CheckBox ID="ChkDelAll" runat="server" Text="Delete"  AutoPostBack="true" OnCheckedChanged="CheckAcceptDelete"/>
                                        </HeaderTemplate>
                                        <ItemTemplate>
                                            <asp:CheckBox ID="ChkDel" runat="server"  onclick='Check_Click_Cell(this)' />
                                        </ItemTemplate>
                                    </asp:TemplateField>
                                    <asp:TemplateField ItemStyle-HorizontalAlign="Center">
                                        <HeaderTemplate>
                                            <asp:CheckBox ID="ChkReadAll" runat="server" Text="Read Only"  AutoPostBack="true" OnCheckedChanged="CheckAcceptRead"/>
                                        </HeaderTemplate>
                                        <ItemTemplate>
                                            <asp:CheckBox ID="ChkRead" runat="server"  onclick='Check_Click_Cell(this)' />
                                        </ItemTemplate>
                                    </asp:TemplateField>
                                </Columns>
                                <FooterStyle BackColor="#99CCCC" ForeColor="#003399" />
                                <PagerStyle BackColor="#99CCCC" ForeColor="#003399" HorizontalAlign="Left" />
                                <SelectedRowStyle BackColor="#009999" Font-Bold="True" ForeColor="#CCFF99" />
                                <HeaderStyle BackColor="#003399" Font-Bold="True" ForeColor="#CCCCFF" />
                            </asp:GridView>
                                
                        </fieldset>
                    </td>
                </tr>
                <tr>
                    <td colspan="3">&nbsp;</td>
                </tr>
                <tr>
                    <td colspan="3"></td>
                </tr>
            </table>
        </ContentTemplate>
     </asp:UpdatePanel>
</asp:Content>

