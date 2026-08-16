<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Password_Config.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="#153E7E" Text="Please Wait...."></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <table style="width: 100%">
                <tr>
                    <td align="center" bgcolor="#333333" colspan="4">
                        <asp:Label ID="Label6" runat="server" Font-Bold="True" Font-Size="Medium" 
                            ForeColor="Silver" style="font-weight: 700" 
                            Text="PASSWORD CONF SETTINGS"></asp:Label>
                    </td>
                </tr>
                <tr>
                    <td colspan="4">
                        <asp:Panel ID="Panel9" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Height="100%" style="font-weight: 700" Width="1121px">
                            <table style="width: 99%">
                                <tr>
                                    <td class="style8" colspan="3">
                                        <asp:Panel ID="Panel12" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="100%">
                                            <telerik:RadGrid ID="GDSEARCH" runat="server" AllowPaging="True" 
                                                CellSpacing="0" GridLines="None" Height="100%" Skin="Sunset" 
                                                Width="100%">
                                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="ID">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                        <HeaderStyle Width="20px" />
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                        <HeaderStyle Width="20px" />
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridButtonColumn CommandName="Select" 
                                                            FilterControlAltText="Filter ID column" HeaderText="Select" Text="Select" 
                                                            UniqueName="Select">
                                                            <HeaderStyle ForeColor="Blue" Width="50px" />
                                                            <ItemStyle Width="50px" />
                                                        </telerik:GridButtonColumn>
                                                        <telerik:GridBoundColumn DataField="ID" FilterControlAltText="Filter ID column" 
                                                            HeaderText="ID" SortExpression="ID" UniqueName="ID">
                                                        </telerik:GridBoundColumn>
                                                            <telerik:GridBoundColumn DataField="Len" 
                                                            FilterControlAltText="Filter Len column" HeaderText="Length" 
                                                            SortExpression="Len" UniqueName="Len">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Hist" 
                                                            FilterControlAltText="Filter Hist column" HeaderText="History" 
                                                            SortExpression="Hist" UniqueName="Hist">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Lock_cnt" 
                                                            FilterControlAltText="Filter Lock_cnt column" HeaderText="Lock_cnt" 
                                                            SortExpression="Lock_cnt" UniqueName="Lock_cnt">
                                                            </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="Is_Numeric" 
                                                            FilterControlAltText="Filter Is_Numeric column" HeaderText="Is_Numeric" 
                                                            SortExpression="Is_Numeric" UniqueName="Is_Numeric">
                                                            </telerik:GridBoundColumn>
                                                                      <telerik:GridBoundColumn DataField="Is_special" 
                                                            FilterControlAltText="Filter Is_special column" HeaderText="Is_special" 
                                                            SortExpression="Is_special" UniqueName="Is_special">
                                                            </telerik:GridBoundColumn>
                                                                  <telerik:GridBoundColumn DataField="Is_Capital" 
                                                            FilterControlAltText="Filter Is_Capital column" HeaderText="Is_Capital" 
                                                            SortExpression="Is_Capital" UniqueName="Is_Capital">
                                                            </telerik:GridBoundColumn>
                                                                 <telerik:GridBoundColumn DataField="Pass_Reset" 
                                                            FilterControlAltText="Filter Pass_Reset column" HeaderText="Pass_Reset" 
                                                            SortExpression="Pass_Reset" UniqueName="Pass_Reset">
                                                            </telerik:GridBoundColumn>
                                                       
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width: 138px">
                                        <asp:Label ID="Label126" runat="server" Text="Password Length"></asp:Label>
                                    </td>
                                    <td>
                                        <telerik:RadTextBox ID="txtlengt" Runat="server" Skin="Sunset" Width="250px" 
                                            EmptyMessage="10">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td style="width: 287px">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="width: 138px">
                                        <asp:Label ID="Label131" runat="server" Text="Password History"></asp:Label>
                                    </td>
                                    <td>
                                        <telerik:RadTextBox ID="txthistory" Runat="server" Skin="Sunset" Width="250px" 
                                            EmptyMessage="10">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td style="width: 287px">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="width: 138px">
                                        <asp:Label ID="Label148" runat="server" Text="Lock Count"></asp:Label>
                                    </td>
                                    <td>
                                        <telerik:RadTextBox ID="txtlock" Runat="server" EmptyMessage="3" Skin="Sunset" 
                                            Width="250px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td style="width: 287px">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="width: 138px">
                                        <asp:Label ID="Label152" runat="server" Text="Pass Reset"></asp:Label>
                                    </td>
                                    <td>
                                        <telerik:RadTextBox ID="txtpass" Runat="server" EmptyMessage="30" Skin="Sunset" 
                                            Width="250px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td style="width: 287px">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="width: 138px">
                                        <asp:Label ID="Label149" runat="server" Text="Numeric"></asp:Label>
                                    </td>
                                    <td>
                                        <telerik:RadComboBox ID="cbonumeric" Runat="server" AccessibilityMode="True" 
                                            AllowCustomText="True" MarkFirstMatch="True" Skin="Sunset" Width="150px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Text="Yes" Value="Yes" />
                                                <telerik:RadComboBoxItem runat="server" Text="No" Value="No" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td style="width: 287px">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="width: 138px">
                                        <asp:Label ID="Label150" runat="server" Text="Capital Letter"></asp:Label>
                                    </td>
                                    <td>
                                        <telerik:RadComboBox ID="cbocap" Runat="server" AccessibilityMode="True" 
                                            AllowCustomText="True" MarkFirstMatch="True" Skin="Sunset" Width="150px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Owner="cbocap" Text="Yes" Value="Yes" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cbocap" Text="No" Value="No" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td style="width: 287px">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="width: 138px">
                                        <asp:Label ID="Label151" runat="server" Text="Special Character"></asp:Label>
                                    </td>
                                    <td style="height: 26px">
                                        <telerik:RadComboBox ID="cbospec" Runat="server" AccessibilityMode="True" 
                                            AllowCustomText="True" MarkFirstMatch="True" Skin="Sunset" Width="150px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Owner="cbospec" Text="Yes" 
                                                    Value="Yes" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cbospec" Text="No" Value="No" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td style="width: 287px; height: 26px;">
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width: 138px; height: 41px;">
                                    </td>
                                    <td style="height: 41px;">
                                        <telerik:RadButton ID="cmdsave" runat="server" Skin="Simple" Text="Save" 
                                            Width="80px" Height="35px">
                                        </telerik:RadButton>
                                        &nbsp;<telerik:RadButton ID="cmdedit" runat="server" Skin="Simple" Text="Edit" 
                                            Width="80px">
                                        </telerik:RadButton>
                                    </td>
                                    <td style="width: 287px; height: 41px;">
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" colspan="2">
                                        <asp:Label ID="lblerr" runat="server" ForeColor="Red" Font-Size="Medium"></asp:Label>
                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                    <td style="width: 287px">
                                        &nbsp;&nbsp;&nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" colspan="3">
                                        <hr style="width: 1107px" />
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                </tr>
                <tr>
                    <td style="width: 105px">
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                </tr>
            </table>
        </ContentTemplate>
      
    </asp:UpdatePanel>
</asp:Content>


